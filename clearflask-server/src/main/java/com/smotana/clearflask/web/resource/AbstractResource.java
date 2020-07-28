package com.smotana.clearflask.web.resource;

import com.google.common.annotations.VisibleForTesting;
import com.smotana.clearflask.web.Application;
import com.smotana.clearflask.web.security.ExtendedSecurityContext.ExtendedPrincipal;
import lombok.extern.slf4j.Slf4j;

import javax.inject.Singleton;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.ws.rs.Path;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.SecurityContext;
import java.util.Optional;

@Slf4j
@Singleton
@Path(Application.RESOURCE_VERSION)
public abstract class AbstractResource {

    @VisibleForTesting
    @Context
    HttpServletRequest request;
    @VisibleForTesting
    @Context
    HttpServletResponse response;
    @VisibleForTesting
    @Context
    SecurityContext securityContext;

    protected Optional<ExtendedPrincipal> getExtendedPrincipal() {
        if (securityContext.getUserPrincipal() == null) {
            return Optional.empty();
        }
        if (!(securityContext.getUserPrincipal() instanceof ExtendedPrincipal)) {
            log.warn("Request with no ExtendedPrincipal");
            throw new WebApplicationException(Response.status(Response.Status.INTERNAL_SERVER_ERROR).build());
        }
        return Optional.of((ExtendedPrincipal) securityContext.getUserPrincipal());
    }
}
