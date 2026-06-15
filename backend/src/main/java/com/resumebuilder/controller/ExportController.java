package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class ExportController {

    private final ExportService exportService;

    @PostMapping("/resume")
    public ResponseEntity<byte[]> exportResume(
            Authentication authentication,
            @RequestBody Map<String, String> body) throws Exception {
        String userId = authentication.getName();
        String layoutId = body.get("layoutId");

        // 生成简历数据 & 获取用户信息
        byte[] docxData = exportService.generateResume(userId, layoutId);
        String userName = exportService.getUserName(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        String filename = java.net.URLEncoder.encode("简历_" + userName + ".docx", "UTF-8");
        headers.setContentDispositionFormData("attachment", filename);

        return ResponseEntity.ok()
                .headers(headers)
                .body(docxData);
    }
}
