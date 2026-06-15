package com.resumebuilder.entity;

import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

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

    private String type; // project, internship, competition, skill, certification, other

    private Date startDate;

    private Date endDate;

    private String description;

    private List<String> achievements;

    private List<String> skills;

    private List<Attachment> attachments;

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
}
