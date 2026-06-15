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

    @NotBlank(message = "描述不能为空")
    private String description;

    private List<String> achievements;

    private List<String> skills;

    private List<DailyRecord.Attachment> attachments;

    private String link;

    private Boolean isPublic;
}
