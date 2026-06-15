package com.resumebuilder.repository;

import com.resumebuilder.entity.Template;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TemplateRepository extends MongoRepository<Template, String> {
    List<Template> findByTagsIn(List<String> tags);
    List<Template> findByIsOfficialTrue();
    List<Template> findAllByOrderByUsageCountDesc();
}
