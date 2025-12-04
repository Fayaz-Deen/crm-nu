package com.crm.repository;

import com.crm.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, String> {
    List<Tag> findByUserId(String userId);
    Optional<Tag> findByUserIdAndName(String userId, String name);
    boolean existsByUserIdAndName(String userId, String name);

    @Query("SELECT t.name FROM Tag t WHERE t.userId = ?1")
    List<String> findTagNamesByUserId(String userId);
}
