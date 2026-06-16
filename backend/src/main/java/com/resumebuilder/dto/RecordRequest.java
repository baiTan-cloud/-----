package com.resumebuilder.dto;

import com.resumebuilder.entity.DailyRecord;

import lombok.Data;

import javax.validation.constraints.NotBlank;
import java.util.Date;
import java.util.List;

@Data
public class RecordRequest {

    @NotBlank(message = "标题不能为空")
    private String title;

    @NotBlank(message = "类型不能为空")
    private String type;

    private Date startDate;

    private Date endDate;

    /** @deprecated 旧字段，新记录可留空 */
    @Deprecated
    private String description;

    private String role;

    private String orgName;

    private String whatDone;

    private String challenge;

    private String solution;

    private String outcome;

    private List<String> achievements;

    private List<String> skills;

    private String major;

    private String degree;

    private String gpa;

    private List<DailyRecord.Attachment> attachments;

    private List<DailyRecord.Entry> entries;

    private String link;

    private Boolean isPublic;
}
