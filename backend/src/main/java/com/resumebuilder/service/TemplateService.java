package com.resumebuilder.service;

import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.entity.Template;
import com.resumebuilder.repository.ResumeLayoutRepository;
import com.resumebuilder.repository.TemplateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TemplateService {

    private final TemplateRepository templateRepository;
    private final LayoutService layoutService;
    private final ResumeLayoutRepository layoutRepository;

    public List<Template> getTemplates(List<String> tags) {
        if (tags != null && !tags.isEmpty()) {
            return templateRepository.findByTagsIn(tags);
        }
        return templateRepository.findAllByOrderByUsageCountDesc();
    }

    public Template getTemplate(String templateId) {
        return templateRepository.findById(templateId)
                .orElseThrow(() -> new RuntimeException("模板不存在"));
    }

    public ResumeLayout useTemplate(String userId, String templateId) {
        Template template = getTemplate(templateId);

        // 复制模板布局到用户布局
        ResumeLayout layout = layoutService.saveLayout(
                userId,
                template.getName() + " 副本",
                template.getLayoutData()
        );
        layout.setTemplateId(templateId);
        layout = layoutRepository.save(layout); // ⬅️ 保存 templateId

        // 增加使用计数
        template.setUsageCount(template.getUsageCount() + 1);
        templateRepository.save(template);

        return layout;
    }
}
