package com.resumebuilder.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.resumebuilder.dto.RecordRequest;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.repository.DailyRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecordService {

    private final DailyRecordRepository recordRepository;

    public Page<DailyRecord> getRecords(String userId, int page, int size,
                                         String type, String keyword, String skills) {
        PageRequest pageRequest = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "updatedAt"));

        if (keyword != null && !keyword.isEmpty()) {
            return recordRepository.searchByKeyword(userId, keyword, pageRequest);
        }
        if (type != null && !type.isEmpty()) {
            return recordRepository.findByUserIdAndTypeAndDeletedFalse(userId, type, pageRequest);
        }
        if (skills != null && !skills.isEmpty()) {
            return recordRepository.findByUserIdAndSkillsInAndDeletedFalse(
                    userId, java.util.List.of(skills.split(",")), pageRequest);
        }
        return recordRepository.findByUserIdAndDeletedFalseOrderByUpdatedAtDesc(userId, pageRequest);
    }

    public DailyRecord getRecord(String userId, String recordId) {
        DailyRecord record = recordRepository.findById(recordId)
                .orElseThrow(() -> new RuntimeException("记录不存在"));
        if (!record.getUserId().equals(userId) || record.getDeleted()) {
            throw new RuntimeException("记录不存在");
        }
        return record;
    }

    public DailyRecord createRecord(String userId, RecordRequest request) {
        DailyRecord record = new DailyRecord();
        record.setUserId(userId);
        applyRequest(record, request);
        record.setCreatedAt(new Date());
        record.setUpdatedAt(new Date());
        return recordRepository.save(record);
    }

    public DailyRecord updateRecord(String userId, String recordId, RecordRequest request) {
        DailyRecord record = getRecord(userId, recordId);
        applyRequest(record, request);
        record.setUpdatedAt(new Date());
        return recordRepository.save(record);
    }

    public void deleteRecord(String userId, String recordId) {
        DailyRecord record = getRecord(userId, recordId);
        record.setDeleted(true);
        record.setDeletedAt(new Date());
        recordRepository.save(record);
    }

    /** 批量删除（软删除） */
    public void batchDelete(String userId, List<String> ids) {
        List<DailyRecord> records = new java.util.ArrayList<>();
        recordRepository.findAllById(ids).forEach(records::add);
        Date now = new Date();
        for (DailyRecord record : records) {
            if (record.getUserId().equals(userId) && !record.getDeleted()) {
                record.setDeleted(true);
                record.setDeletedAt(now);
            }
        }
        recordRepository.saveAll(records);
    }

    /** 导出记录为 JSON 字符串 */
    public String exportRecords(String userId, String type, String format) {
        List<DailyRecord> records;
        if (type != null && !type.isEmpty()) {
            records = recordRepository.findByUserIdAndDeletedFalse(userId).stream()
                    .filter(r -> type.equals(r.getType()))
                    .collect(Collectors.toList());
        } else {
            records = recordRepository.findByUserIdAndDeletedFalse(userId);
        }

        try {
            ObjectMapper mapper = new ObjectMapper();
            mapper.registerModule(new JavaTimeModule());
            if ("csv".equals(format)) {
                StringBuilder sb = new StringBuilder("title,type,description,startDate,endDate,skills,achievements,link\n");
                for (DailyRecord r : records) {
                    sb.append(escapeCsv(r.getTitle())).append(",");
                    sb.append(escapeCsv(r.getType())).append(",");
                    sb.append(escapeCsv(r.getDescription())).append(",");
                    sb.append(r.getStartDate() != null ? r.getStartDate().getTime() : "").append(",");
                    sb.append(r.getEndDate() != null ? r.getEndDate().getTime() : "").append(",");
                    sb.append(escapeCsv(String.join(";", r.getSkills() != null ? r.getSkills() : List.of()))).append(",");
                    sb.append(escapeCsv(String.join(";", r.getAchievements() != null ? r.getAchievements() : List.of()))).append(",");
                    sb.append(escapeCsv(r.getLink() != null ? r.getLink() : "")).append("\n");
                }
                return sb.toString();
            }
            return mapper.writerWithDefaultPrettyPrinter().writeValueAsString(records);
        } catch (Exception e) {
            throw new RuntimeException("导出失败: " + e.getMessage());
        }
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }

    /** 批量导入记录 */
    public int importRecords(String userId, List<RecordRequest> requests) {
        Date now = new Date();
        List<DailyRecord> records = requests.stream().map(req -> {
            DailyRecord r = new DailyRecord();
            r.setUserId(userId);
            applyRequest(r, req);
            r.setCreatedAt(now);
            r.setUpdatedAt(now);
            return r;
        }).collect(Collectors.toList());
        recordRepository.saveAll(records);
        return records.size();
    }

    private void applyRequest(DailyRecord record, RecordRequest request) {
        record.setTitle(request.getTitle());
        record.setType(request.getType());
        record.setStartDate(request.getStartDate());
        record.setEndDate(request.getEndDate());
        record.setDescription(request.getDescription());
        record.setRole(request.getRole());
        record.setOrgName(request.getOrgName());
        record.setWhatDone(request.getWhatDone());
        record.setChallenge(request.getChallenge());
        record.setSolution(request.getSolution());
        record.setOutcome(request.getOutcome());
        record.setAchievements(request.getAchievements());
        record.setSkills(request.getSkills());
        record.setMajor(request.getMajor());
        record.setDegree(request.getDegree());
        record.setGpa(request.getGpa());
        record.setAttachments(request.getAttachments());
        record.setEntries(request.getEntries());
        record.setLink(request.getLink());
        record.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : false);
    }
}
