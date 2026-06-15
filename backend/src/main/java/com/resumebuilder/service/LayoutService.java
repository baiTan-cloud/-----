package com.resumebuilder.service;

import com.resumebuilder.entity.ResumeLayout;
import com.resumebuilder.repository.ResumeLayoutRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Date;
import java.util.List;

@Service
@RequiredArgsConstructor
public class LayoutService {

    private final ResumeLayoutRepository layoutRepository;

    public List<ResumeLayout> getUserLayouts(String userId) {
        return layoutRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }

    public ResumeLayout getLayout(String userId, String layoutId) {
        ResumeLayout layout = layoutRepository.findById(layoutId)
                .orElseThrow(() -> new RuntimeException("布局不存在"));
        if (!layout.getUserId().equals(userId)) {
            throw new RuntimeException("无权访问此布局");
        }
        return layout;
    }

    public ResumeLayout saveLayout(String userId, String name, ResumeLayout.LayoutData layoutData) {
        ResumeLayout layout = new ResumeLayout();
        layout.setUserId(userId);
        layout.setName(name);
        layout.setLayoutData(layoutData);
        layout.setCreatedAt(new Date());
        layout.setUpdatedAt(new Date());
        return layoutRepository.save(layout);
    }

    public ResumeLayout updateLayout(String userId, String layoutId, String name,
                                      ResumeLayout.LayoutData layoutData) {
        ResumeLayout layout = getLayout(userId, layoutId);
        layout.setName(name);
        layout.setLayoutData(layoutData);
        layout.setUpdatedAt(new Date());
        return layoutRepository.save(layout);
    }

    public void deleteLayout(String userId, String layoutId) {
        ResumeLayout layout = getLayout(userId, layoutId);
        layoutRepository.delete(layout);
    }
}
