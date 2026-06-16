package com.resumebuilder.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Data
@Document(collection = "daily_records")
@CompoundIndex(name = "user_type_date", def = "{'userId': 1, 'type': 1, 'startDate': -1}")
public class DailyRecord {
    @Id
    private String id;

    @Indexed
    private String userId;

    private String title;

    private String type; // project, internship, competition, skill, certification, education, other

    private Date startDate;

    private Date endDate;

    /** @deprecated 逐步迁移到碎片化字段（role, whatDone, outcome 等），新记录可留空 */
    @Deprecated
    private String description;

    /** 角色：如「后端负责人」「项目经理」 */
    private String role;

    /** 组织/公司/学校名称 */
    private String orgName;

    /** 做了什么（一句话概括核心工作） */
    private String whatDone;

    /** 难点挑战 */
    private String challenge;

    /** 解决方案 */
    private String solution;

    /** 成果（含量化指标） */
    private String outcome;

    private List<String> achievements;

    private List<String> skills;

    // ====== type=education 专有字段 ======

    /** 专业 */
    private String major;

    /** 学位：本科/硕士/博士 */
    private String degree;

    /** GPA */
    private String gpa;

    private List<Attachment> attachments;

    /** 时间线条目：每次做了什么 */
    @Field("entries")
    private List<Entry> entries;

    private String link;

    private Boolean isPublic = false;

    private Boolean isHidden = false;

    private Boolean deleted = false;

    private Date deletedAt;

    private Date createdAt;

    private Date updatedAt;

    @Data
    public static class Attachment {
        private String url;
        private String name;
        private String type; // image, pdf
    }

    /** 单次时间线条目 */
    @Data
    public static class Entry {
        private Date date;
        private String description;           // 本次做了什么
        private List<String> achievements;    // 本次的成果
        private List<String> skills;          // 本次用到的技能
    }
}
