package com.resumebuilder.service;

import com.resumebuilder.dto.RecordRequest;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.repository.DailyRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Date;

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

    private void applyRequest(DailyRecord record, RecordRequest request) {
        record.setTitle(request.getTitle());
        record.setType(request.getType());
        record.setStartDate(request.getStartDate());
        record.setEndDate(request.getEndDate());
        record.setDescription(request.getDescription());
        record.setAchievements(request.getAchievements());
        record.setSkills(request.getSkills());
        record.setAttachments(request.getAttachments());
        record.setLink(request.getLink());
        record.setIsPublic(request.getIsPublic() != null ? request.getIsPublic() : false);
    }
}
