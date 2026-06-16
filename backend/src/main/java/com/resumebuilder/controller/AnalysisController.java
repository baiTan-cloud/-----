package com.resumebuilder.controller;

import com.resumebuilder.dto.ApiResponse;
import com.resumebuilder.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/analysis")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @GetMapping("/skills")
    public ApiResponse<Map<String, Integer>> getSkillFrequency(Authentication authentication) {
        String userId = authentication.getName();
        Map<String, Integer> frequency = analysisService.analyzeSkillFrequency(userId);
        return ApiResponse.success(frequency);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> getStats(Authentication authentication) {
        String userId = authentication.getName();
        return ApiResponse.success(analysisService.getStats(userId));
    }
}
