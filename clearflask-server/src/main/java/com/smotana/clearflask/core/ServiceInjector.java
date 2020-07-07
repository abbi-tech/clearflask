package com.smotana.clearflask.core;

import com.amazonaws.auth.AWSCredentialsProvider;
import com.amazonaws.auth.AWSStaticCredentialsProvider;
import com.amazonaws.auth.BasicAWSCredentials;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.google.common.annotations.VisibleForTesting;
import com.google.common.util.concurrent.GuavaRateLimiters;
import com.google.common.util.concurrent.ServiceManager;
import com.google.inject.Module;
import com.google.inject.*;
import com.google.inject.name.Names;
import com.kik.config.ice.ConfigSystem;
import com.kik.config.ice.convert.ConfigValueConverters;
import com.kik.config.ice.convert.MoreConfigValueConverters;
import com.kik.config.ice.interceptor.NoopConfigValueInterceptor;
import com.kik.config.ice.internal.ConfigDescriptorHolder;
import com.kik.config.ice.naming.SimpleConfigNamingStrategy;
import com.kik.config.ice.source.FileDynamicConfigSource;
import com.kik.config.ice.source.JmxDynamicConfigSource;
import com.smotana.clearflask.billing.StripeBillingImpl;
import com.smotana.clearflask.core.email.AmazonSimpleEmailServiceProvider;
import com.smotana.clearflask.core.push.NotificationServiceImpl;
import com.smotana.clearflask.core.push.message.*;
import com.smotana.clearflask.core.push.provider.BrowserPushServiceImpl;
import com.smotana.clearflask.core.push.provider.EmailServiceImpl;
import com.smotana.clearflask.security.ClearFlaskSso;
import com.smotana.clearflask.security.limiter.TieredWebLimiter;
import com.smotana.clearflask.security.limiter.challenge.CaptchaChallenger;
import com.smotana.clearflask.security.limiter.challenge.LocalChallengeLimiter;
import com.smotana.clearflask.security.limiter.rate.LocalRateLimiter;
import com.smotana.clearflask.store.dynamo.DefaultDynamoDbProvider;
import com.smotana.clearflask.store.dynamo.mapper.DynamoMapperImpl;
import com.smotana.clearflask.store.elastic.DefaultElasticSearchProvider;
import com.smotana.clearflask.store.impl.*;
import com.smotana.clearflask.util.BeanUtil;
import com.smotana.clearflask.util.DefaultServerSecret;
import com.smotana.clearflask.util.ElasticUtil;
import com.smotana.clearflask.util.GsonProvider;
import com.smotana.clearflask.web.Application;
import com.smotana.clearflask.web.filter.LogExFilter;
import com.smotana.clearflask.web.resource.*;
import com.smotana.clearflask.web.security.AuthCookieImpl;
import lombok.NoArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import javax.management.MBeanServer;
import java.lang.management.ManagementFactory;
import java.time.Duration;

@Slf4j
@NoArgsConstructor
public enum ServiceInjector {
    INSTANCE;

    public enum Environment {
        TEST(false),
        DEVELOPMENT_LOCAL(false),
        PRODUCTION_AWS(true);

        private boolean isProduction;

        Environment(boolean isProduction) {
            this.isProduction = isProduction;
        }

        public boolean isProduction() {
            return isProduction;
        }
    }

    private static volatile Injector injector = null;

    public Injector get() {
        if (injector == null) {
            synchronized (ServiceInjector.class) {
                if (injector == null) {
                    Environment env = detectEnvironment();
                    log.info("Detected environment {}", env.name());
                    Injector newInjector = create(env, Stage.DEVELOPMENT);
                    injector = newInjector;
                }
            }
        }
        return injector;
    }

    @VisibleForTesting
    protected Injector create(Environment env, Stage stage) {
        return Guice.createInjector(stage, module(env));
    }

    public void startServices() {
        log.info("Starting services");
        get().getInstance(ServiceManager.class).startAsync().awaitHealthy();
    }

    public void shutdownServices() {
        log.info("Stopping services");
        get().getInstance(ServiceManager.class).stopAsync().awaitStopped();
    }

    private static Module module(Environment env) {
        return new AbstractModule() {
            @Override
            protected void configure() {
                bind(Environment.class).toInstance(env);

                install(ServiceManagerProvider.module());
                install(GsonProvider.module());
                install(GuavaRateLimiters.module());

                // Stores
                install(DynamoProjectStore.module());
                install(DynamoAccountStore.module());
                install(DynamoElasticUserStore.module());
                install(DynamoElasticIdeaStore.module());
                install(DynamoNotificationStore.module());
                install(DynamoElasticCommentStore.module());
                install(DynamoVoteStore.module());
                install(StaticPlanStore.module());
                install(ResourceLegalStore.module());
                install(DynamoMapperImpl.module());
                install(ElasticUtil.module());
                install(DefaultServerSecret.module(Names.named("cursor")));

                // Notification
                install(NotificationServiceImpl.module());
                install(AmazonSimpleEmailServiceProvider.module());
                install(EmailNotificationTemplate.module());
                install(EmailServiceImpl.module());
                install(BrowserPushServiceImpl.module());
                install(OnCommentReply.module());
                install(OnStatusOrResponseChange.module());
                install(OnForgotPassword.module());
                install(OnAdminInvite.module());
                install(OnEmailChanged.module());

                // Security
                install(TieredWebLimiter.module());
                install(LocalRateLimiter.module());
                install(LocalChallengeLimiter.module());
                install(CaptchaChallenger.module());

                // Configuration
                install(ConfigSystem.module());
                install(SimpleConfigNamingStrategy.module());
                install(ConfigValueConverters.module());
                install(MoreConfigValueConverters.module());
                install(NoopConfigValueInterceptor.module());
                bind(ConfigDescriptorHolder.class);
                // Need to handle re-registering beans if tomcat doesn't restart between loading app again
                MBeanServer mBeanServer = BeanUtil.wrapOverwriteRegister(ManagementFactory.getPlatformMBeanServer());
                bind(MBeanServer.class).toInstance(mBeanServer);
                install(JmxDynamicConfigSource.module());
                install(FileDynamicConfigSource.module());
                bind(Duration.class).annotatedWith(Names.named(FileDynamicConfigSource.POLL_INTERVAL_NAME)).toInstance(Duration.ofSeconds(10));

                // API endpoints
                install(Application.module());
                bind(HealthResource.class);
                install(UserResource.module());
                install(StripeResource.module());
                install(AccountResource.module());
                install(IdeaResource.module());
                install(VoteResource.module());
                install(ProjectResource.module());
                install(SupportResource.module());

                // Other
                install(LogExFilter.module());
                install(ClearFlaskSso.module());
                install(AuthCookieImpl.module());
                install(StripeBillingImpl.module());

                switch (env) {
                    case DEVELOPMENT_LOCAL:
                        bind(AWSCredentialsProvider.class).toInstance(new AWSStaticCredentialsProvider(new BasicAWSCredentials("", "")));
                        install(DefaultDynamoDbProvider.module());
                        install(DefaultElasticSearchProvider.module());
                        bind(String.class).annotatedWith(Names.named(FileDynamicConfigSource.FILENAME_NAME)).toInstance(
                                getClass().getClassLoader().getResource("config-local.cfg").getPath());
                        break;
                    case PRODUCTION_AWS:
                        bind(AWSCredentialsProvider.class).to(DefaultAWSCredentialsProviderChain.class);
                        install(DefaultDynamoDbProvider.module());
                        install(DefaultElasticSearchProvider.module());
                        bind(String.class).annotatedWith(Names.named(FileDynamicConfigSource.FILENAME_NAME)).toInstance(
                                "/opt/clearflask/config-prod.cfg");
                        break;
                    default:
                        throw new RuntimeException("Unknown environment: " + env);
                }

            }
        };
    }

    private static Environment detectEnvironment() {
        String envEnvironment = System.getenv("CLEARFLASK_ENVIRONMENT");
        if (envEnvironment != null) {
            return Environment.valueOf(envEnvironment);
        }
        throw new RuntimeException("Could not determine environment. Did you forget to set env var CLEARFLASK_ENVIRONMENT?");
    }
}
