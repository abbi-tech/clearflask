/*
 * This file is generated by jOOQ.
 */
package com.smotana.clearflask.store.mysql.model;


import com.smotana.clearflask.store.mysql.model.tables.JooqAccount;
import com.smotana.clearflask.store.mysql.model.tables.JooqComment;
import com.smotana.clearflask.store.mysql.model.tables.JooqCommentParentId;
import com.smotana.clearflask.store.mysql.model.tables.JooqIdea;
import com.smotana.clearflask.store.mysql.model.tables.JooqIdeaFunders;
import com.smotana.clearflask.store.mysql.model.tables.JooqIdeaTags;
import com.smotana.clearflask.store.mysql.model.tables.JooqUser;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqAccountRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqCommentParentIdRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqCommentRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqIdeaFundersRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqIdeaRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqIdeaTagsRecord;
import com.smotana.clearflask.store.mysql.model.tables.records.JooqUserRecord;

import javax.annotation.processing.Generated;

import org.jooq.ForeignKey;
import org.jooq.TableField;
import org.jooq.UniqueKey;
import org.jooq.impl.DSL;
import org.jooq.impl.Internal;


/**
 * A class modelling foreign key relationships and constraints of tables in the
 * default schema.
 */
@Generated(
    value = {
        "https://www.jooq.org",
        "jOOQ version:3.16.10"
    },
    comments = "This class is generated by jOOQ"
)
@SuppressWarnings({ "all", "unchecked", "rawtypes" })
public class JooqKeys {

    // -------------------------------------------------------------------------
    // UNIQUE and PRIMARY KEY definitions
    // -------------------------------------------------------------------------

    public static final UniqueKey<JooqAccountRecord> KEY_ACCOUNT_PRIMARY = Internal.createUniqueKey(JooqAccount.ACCOUNT, DSL.name("KEY_account_PRIMARY"), new TableField[] { JooqAccount.ACCOUNT.ACCOUNTID }, true);
    public static final UniqueKey<JooqCommentRecord> KEY_COMMENT_PRIMARY = Internal.createUniqueKey(JooqComment.COMMENT, DSL.name("KEY_comment_PRIMARY"), new TableField[] { JooqComment.COMMENT.PROJECTID, JooqComment.COMMENT.POSTID, JooqComment.COMMENT.COMMENTID }, true);
    public static final UniqueKey<JooqCommentParentIdRecord> KEY_COMMENT_PARENT_ID_PRIMARY = Internal.createUniqueKey(JooqCommentParentId.COMMENT_PARENT_ID, DSL.name("KEY_comment_parent_id_PRIMARY"), new TableField[] { JooqCommentParentId.COMMENT_PARENT_ID.PROJECTID, JooqCommentParentId.COMMENT_PARENT_ID.POSTID, JooqCommentParentId.COMMENT_PARENT_ID.COMMENTID, JooqCommentParentId.COMMENT_PARENT_ID.PARENTCOMMENTID }, true);
    public static final UniqueKey<JooqIdeaRecord> KEY_IDEA_PRIMARY = Internal.createUniqueKey(JooqIdea.IDEA, DSL.name("KEY_idea_PRIMARY"), new TableField[] { JooqIdea.IDEA.PROJECTID, JooqIdea.IDEA.POSTID }, true);
    public static final UniqueKey<JooqIdeaFundersRecord> KEY_IDEA_FUNDERS_PRIMARY = Internal.createUniqueKey(JooqIdeaFunders.IDEA_FUNDERS, DSL.name("KEY_idea_funders_PRIMARY"), new TableField[] { JooqIdeaFunders.IDEA_FUNDERS.PROJECTID, JooqIdeaFunders.IDEA_FUNDERS.POSTID, JooqIdeaFunders.IDEA_FUNDERS.FUNDERUSERID }, true);
    public static final UniqueKey<JooqIdeaTagsRecord> KEY_IDEA_TAGS_PRIMARY = Internal.createUniqueKey(JooqIdeaTags.IDEA_TAGS, DSL.name("KEY_idea_tags_PRIMARY"), new TableField[] { JooqIdeaTags.IDEA_TAGS.PROJECTID, JooqIdeaTags.IDEA_TAGS.POSTID, JooqIdeaTags.IDEA_TAGS.TAGID }, true);
    public static final UniqueKey<JooqUserRecord> KEY_USER_PRIMARY = Internal.createUniqueKey(JooqUser.USER, DSL.name("KEY_user_PRIMARY"), new TableField[] { JooqUser.USER.PROJECTID, JooqUser.USER.USERID }, true);

    // -------------------------------------------------------------------------
    // FOREIGN KEY definitions
    // -------------------------------------------------------------------------

    public static final ForeignKey<JooqCommentParentIdRecord, JooqCommentRecord> COMMENT_PARENT_ID_IBFK_1 = Internal.createForeignKey(JooqCommentParentId.COMMENT_PARENT_ID, DSL.name("comment_parent_id_ibfk_1"), new TableField[] { JooqCommentParentId.COMMENT_PARENT_ID.PROJECTID, JooqCommentParentId.COMMENT_PARENT_ID.POSTID, JooqCommentParentId.COMMENT_PARENT_ID.COMMENTID }, JooqKeys.KEY_COMMENT_PRIMARY, new TableField[] { JooqComment.COMMENT.PROJECTID, JooqComment.COMMENT.POSTID, JooqComment.COMMENT.COMMENTID }, true);
    public static final ForeignKey<JooqIdeaFundersRecord, JooqIdeaRecord> IDEA_FUNDERS_IBFK_1 = Internal.createForeignKey(JooqIdeaFunders.IDEA_FUNDERS, DSL.name("idea_funders_ibfk_1"), new TableField[] { JooqIdeaFunders.IDEA_FUNDERS.PROJECTID, JooqIdeaFunders.IDEA_FUNDERS.POSTID }, JooqKeys.KEY_IDEA_PRIMARY, new TableField[] { JooqIdea.IDEA.PROJECTID, JooqIdea.IDEA.POSTID }, true);
    public static final ForeignKey<JooqIdeaFundersRecord, JooqUserRecord> IDEA_FUNDERS_IBFK_2 = Internal.createForeignKey(JooqIdeaFunders.IDEA_FUNDERS, DSL.name("idea_funders_ibfk_2"), new TableField[] { JooqIdeaFunders.IDEA_FUNDERS.PROJECTID, JooqIdeaFunders.IDEA_FUNDERS.FUNDERUSERID }, JooqKeys.KEY_USER_PRIMARY, new TableField[] { JooqUser.USER.PROJECTID, JooqUser.USER.USERID }, true);
    public static final ForeignKey<JooqIdeaTagsRecord, JooqIdeaRecord> IDEA_TAGS_IBFK_1 = Internal.createForeignKey(JooqIdeaTags.IDEA_TAGS, DSL.name("idea_tags_ibfk_1"), new TableField[] { JooqIdeaTags.IDEA_TAGS.PROJECTID, JooqIdeaTags.IDEA_TAGS.POSTID }, JooqKeys.KEY_IDEA_PRIMARY, new TableField[] { JooqIdea.IDEA.PROJECTID, JooqIdea.IDEA.POSTID }, true);
}
