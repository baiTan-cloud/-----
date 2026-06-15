package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.dto.RecordRequest;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/records")
@RequiredArgsConstructor
public class RecordController {

    private final RecordService recordService;

    @GetMapping
    public ApiResponse<Map<String, Object>> getRecords(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String skills) {
        String userId = authentication.getName();
        Page<DailyRecord> records = recordService.getRecords(userId, page, size, type, keyword, skills);

        Map<String, Object> data = new HashMap<>();
        data.put("records", records.getContent());
        data.put("total", records.getTotalElements());
        data.put("page", records.getNumber());
        data.put("size", records.getSize());
        return ApiResponse.success(data);
    }

    @GetMapping("/{id}")
    public ApiResponse<DailyRecord> getRecord(Authentication authentication, @PathVariable String id) {
        String userId = authentication.getName();
        DailyRecord record = recordService.getRecord(userId, id);
        return ApiResponse.success(record);
    }

    @PostMapping
    public ApiResponse<DailyRecord> createRecord(Authentication authentication,
                                                  @Valid @RequestBody RecordRequest request) {
        String userId = authentication.getName();
        DailyRecord record = recordService.createRecord(userId, request);
        return ApiResponse.success("创建成功", record);
    }

    @PutMapping("/{id}")
    public ApiResponse<DailyRecord> updateRecord(Authentication authentication,
                                                  @PathVariable String id,
                                                  @Valid @RequestBody RecordRequest request) {
        String userId = authentication.getName();
        DailyRecord record = recordService.updateRecord(userId, id, request);
        return ApiResponse.success("更新成功", record);
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRecord(Authentication authentication, @PathVariable String id) {
        String userId = authentication.getName();
        recordService.deleteRecord(userId, id);
        return ApiResponse.success("删除成功", null);
    }
}
