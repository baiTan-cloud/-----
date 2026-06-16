package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.dto.RecordRequest;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.service.RecordService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
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

    /** 批量删除 */
    @DeleteMapping("/batch")
    public ApiResponse<Void> batchDelete(Authentication authentication, @RequestBody List<String> ids) {
        String userId = authentication.getName();
        recordService.batchDelete(userId, ids);
        return ApiResponse.success("批量删除成功", null);
    }

    /** 导出 JSON */
    @GetMapping("/export")
    public ResponseEntity<byte[]> exportRecords(
            Authentication authentication,
            @RequestParam(required = false) String type,
            @RequestParam(defaultValue = "json") String format) {
        String userId = authentication.getName();
        String json = recordService.exportRecords(userId, type, format);

        String filename = "records_export." + ("csv".equals(format) ? "csv" : "json");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentDispositionFormData("attachment", filename);
        headers.setContentType(MediaType.parseMediaType(
                "csv".equals(format) ? "text/csv" : "application/json"));
        return ResponseEntity.ok()
                .headers(headers)
                .body(json.getBytes(StandardCharsets.UTF_8));
    }

    /** 导入 JSON */
    @PostMapping("/import")
    public ApiResponse<Integer> importRecords(Authentication authentication, @RequestBody List<RecordRequest> requests) {
        String userId = authentication.getName();
        int count = recordService.importRecords(userId, requests);
        return ApiResponse.success("导入成功", count);
    }
}
