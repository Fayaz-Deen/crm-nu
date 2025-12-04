package com.crm.repository;

import com.crm.entity.ContactGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ContactGroupRepository extends JpaRepository<ContactGroup, String> {
    List<ContactGroup> findByUserId(String userId);
    Optional<ContactGroup> findByUserIdAndName(String userId, String name);
    boolean existsByUserIdAndName(String userId, String name);
}
