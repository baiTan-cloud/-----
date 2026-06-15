package com.resumebuilder.service;

import com.hankcs.hanlp.HanLP;
import com.hankcs.hanlp.seg.common.Term;
import com.resumebuilder.entity.DailyRecord;
import com.resumebuilder.repository.DailyRecordRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 技能词频分析服务
 * 使用 HanLP 1.x portable 对记录描述进行分词和词频统计
 */
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final DailyRecordRepository recordRepository;

    @Value("${hanlp.stopwords}")
    private Resource stopwordsResource;

    private final Set<String> stopwords = new HashSet<>();

    @PostConstruct
    public void init() {
        try {
            if (stopwordsResource.exists()) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(stopwordsResource.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#")) {
                            stopwords.add(line);
                        }
                    }
                }
            }
            System.out.println("[HanLP] 停用词表加载完成，共 " + stopwords.size() + " 个停用词");
        } catch (Exception e) {
            System.err.println("[HanLP] 停用词表加载失败: " + e.getMessage());
        }
    }

    /**
     * 统计用户的技能词频
     */
    public Map<String, Integer> analyzeSkillFrequency(String userId) {
        List<DailyRecord> records = recordRepository.findByUserIdAndDeletedFalse(userId);

        // 提取所有描述文本
        String allText = records.stream()
                .map(this::extractPlainText)
                .filter(text -> text != null && !text.isEmpty())
                .collect(Collectors.joining("\n"));

        if (allText.isEmpty()) {
            return Collections.emptyMap();
        }

        // HanLP 分词
        List<Term> terms = HanLP.segment(allText);

        // 统计词频（过滤停用词和单个字符）
        Map<String, Integer> frequency = new LinkedHashMap<>();
        for (Term term : terms) {
            String word = term.word.trim();
            if (word.length() < 2 || stopwords.contains(word)) {
                continue;
            }
            // 只保留名词、动词、形容词、英文单词
            String nature = term.nature.toString();
            if (nature.startsWith("n") || nature.startsWith("v") || nature.startsWith("a")
                    || nature.equals("en")) {
                frequency.merge(word, 1, Integer::sum);
            }
        }

        // 按频次降序排列
        return frequency.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue().reversed())
                .limit(100)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (a, b) -> a,
                        LinkedHashMap::new));
    }

    /**
     * 提取纯文本（去除 HTML/Markdown 标签）
     */
    private String extractPlainText(DailyRecord record) {
        String desc = record.getDescription();
        if (desc == null) return "";

        // 简单去除 HTML 标签
        return desc.replaceAll("<[^>]+>", "")
                .replaceAll("[#*`\\[\\]()>|]", " ")
                .trim();
    }
}
