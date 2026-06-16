package com.resumebuilder.service;

import com.hankcs.hanlp.HanLP;
import com.hankcs.hanlp.dictionary.CustomDictionary;
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
import java.time.YearMonth;
import java.time.ZoneId;
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

    @Value("${hanlp.custom-dict}")
    private Resource customDictResource;

    @Value("${hanlp.skill-exclude}")
    private Resource skillExcludeResource;

    private final Set<String> stopwords = new HashSet<>();
    private final Set<String> skillExcludes = new HashSet<>();
    private final Set<String> customDictWords = new HashSet<>();

    @PostConstruct
    public void init() {
        loadStopwords();
        loadCustomDictionary();
        loadSkillExcludes();
    }

    private void loadStopwords() {
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

    private void loadCustomDictionary() {
        int count = 0;
        try {
            if (customDictResource.exists()) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(customDictResource.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#")) {
                            CustomDictionary.add(line);
                            customDictWords.add(line.toLowerCase());
                            count++;
                        }
                    }
                }
            }
            System.out.println("[HanLP] 自定义词典加载完成，共 " + count + " 个词汇");
        } catch (Exception e) {
            System.err.println("[HanLP] 自定义词典加载失败: " + e.getMessage());
        }
    }

    /** 加载技能排除词（常见业务词，但不是技能） */
    private void loadSkillExcludes() {
        int count = 0;
        try {
            if (skillExcludeResource.exists()) {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(skillExcludeResource.getInputStream(), StandardCharsets.UTF_8))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        line = line.trim();
                        if (!line.isEmpty() && !line.startsWith("#")) {
                            skillExcludes.add(line);
                            count++;
                        }
                    }
                }
            }
            System.out.println("[HanLP] 技能排除词加载完成，共 " + count + " 个");
        } catch (Exception e) {
            System.err.println("[HanLP] 技能排除词加载失败: " + e.getMessage());
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

        // 统计词频（三级过滤）
        Map<String, Integer> frequency = new LinkedHashMap<>();
        for (Term term : terms) {
            String word = term.word.trim();
            String wordLower = word.toLowerCase();
            if (word.length() < 2 || stopwords.contains(word)) {
                continue;
            }

            // 一级：自定义词典中的词 → 100% 是技能，权重 x2
            if (customDictWords.contains(wordLower)) {
                frequency.merge(word, 2, Integer::sum);
                continue;
            }

            // 二级：技能排除词 → 跳过
            if (skillExcludes.contains(word)) {
                continue;
            }

            // 三级：按词性严格筛选
            String nature = term.nature.toString();
            // 只保留：英文词、专有名词(nz)、机构名(nt)、人名(nr)
            // 丢弃：通用名词(n)、动词(v)、形容词(a) —— 这些大概率不是技能
            boolean isSkillNature = nature.equals("en")
                    || nature.equals("nz")
                    || nature.startsWith("nr");
            if (isSkillNature) {
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
     * 获取统计数据：类型分布、月度趋势、总记录数
     */
    public Map<String, Object> getStats(String userId) {
        List<DailyRecord> records = recordRepository.findAllActiveByUserId(userId);

        // 类型分布
        Map<String, Long> typeDistribution = records.stream()
                .collect(Collectors.groupingBy(
                        r -> r.getType() != null ? r.getType() : "other",
                        Collectors.counting()));

        // 月度趋势（按 startDate）
        Map<String, Long> monthlyTrend = records.stream()
                .filter(r -> r.getStartDate() != null)
                .collect(Collectors.groupingBy(r -> {
                    try {
                        return YearMonth.from(r.getStartDate().toInstant()
                                .atZone(ZoneId.systemDefault()).toLocalDate()).toString();
                    } catch (Exception e) {
                        return "unknown";
                    }
                }, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .collect(Collectors.toMap(
                        Map.Entry::getKey, Map.Entry::getValue,
                        (a, b) -> a, LinkedHashMap::new));

        // 技能总词频（复用现有逻辑）
        Map<String, Integer> skillFrequency = analyzeSkillFrequency(userId);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalRecords", records.size());
        stats.put("typeDistribution", typeDistribution);
        stats.put("monthlyTrend", monthlyTrend);
        stats.put("skillFrequency", skillFrequency);
        return stats;
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
