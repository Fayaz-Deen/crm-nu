package com.crm.service;

import com.crm.entity.Contact;
import com.crm.entity.Meeting;
import com.crm.entity.Reminder;
import com.crm.entity.User;
import com.crm.repository.ContactRepository;
import com.crm.repository.MeetingRepository;
import com.crm.repository.ReminderRepository;
import com.crm.repository.UserRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.MonthDay;
import java.util.List;

@Service
public class ReminderService {
    private final ReminderRepository reminderRepository;
    private final ContactRepository contactRepository;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public ReminderService(ReminderRepository reminderRepository, ContactRepository contactRepository,
                           MeetingRepository meetingRepository, UserRepository userRepository,
                           ObjectMapper objectMapper) {
        this.reminderRepository = reminderRepository;
        this.contactRepository = contactRepository;
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    public List<Reminder> getPendingReminders(String userId) {
        return reminderRepository.findByUserIdAndStatus(userId, Reminder.ReminderStatus.PENDING);
    }

    @Transactional
    public Reminder dismissReminder(String userId, String reminderId) {
        Reminder reminder = reminderRepository.findById(reminderId)
                .orElseThrow(() -> new RuntimeException("Reminder not found"));

        if (!reminder.getUserId().equals(userId)) {
            throw new RuntimeException("Access denied");
        }

        reminder.setStatus(Reminder.ReminderStatus.DISMISSED);
        return reminderRepository.save(reminder);
    }

    @Transactional
    public void createBirthdayReminder(Contact contact, User user) {
        if (contact.getBirthday() == null) return;

        int daysBefore = getBirthdayReminderDays(user);
        LocalDate reminderDate = getNextOccurrence(contact.getBirthday()).minusDays(daysBefore);

        if (reminderDate.isBefore(LocalDate.now())) {
            reminderDate = getNextOccurrence(contact.getBirthday());
        }

        createReminder(user.getId(), contact.getId(), Reminder.ReminderType.BIRTHDAY,
                LocalDateTime.of(reminderDate, LocalTime.of(9, 0)));
    }

    @Transactional
    public void createAnniversaryReminder(Contact contact, User user) {
        if (contact.getAnniversary() == null) return;

        int daysBefore = getAnniversaryReminderDays(user);
        LocalDate reminderDate = getNextOccurrence(contact.getAnniversary()).minusDays(daysBefore);

        if (reminderDate.isBefore(LocalDate.now())) {
            reminderDate = getNextOccurrence(contact.getAnniversary());
        }

        createReminder(user.getId(), contact.getId(), Reminder.ReminderType.ANNIVERSARY,
                LocalDateTime.of(reminderDate, LocalTime.of(9, 0)));
    }

    @Transactional
    public void createFollowupReminder(Meeting meeting) {
        if (meeting.getFollowupDate() == null) return;

        createReminder(meeting.getUserId(), meeting.getContactId(), Reminder.ReminderType.FOLLOWUP,
                LocalDateTime.of(meeting.getFollowupDate(), LocalTime.of(9, 0)));
    }

    @Transactional
    public void deleteContactReminders(String contactId) {
        reminderRepository.deleteByContactId(contactId);
    }

    @Transactional
    public void createShareNotification(String userId, String contactId) {
        createReminder(userId, contactId, Reminder.ReminderType.SHARE,
                LocalDateTime.now());
    }

    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void generateDailyReminders() {
        List<User> users = userRepository.findAll();

        for (User user : users) {
            generateBirthdayReminders(user);
            generateAnniversaryReminders(user);
            generateNoContactReminders(user);
        }
    }

    private void generateBirthdayReminders(User user) {
        int daysBefore = getBirthdayReminderDays(user);
        LocalDate targetDate = LocalDate.now().plusDays(daysBefore);
        MonthDay targetMonthDay = MonthDay.from(targetDate);

        List<Contact> contacts = contactRepository.findByUserId(user.getId());
        for (Contact contact : contacts) {
            if (contact.getBirthday() != null && MonthDay.from(contact.getBirthday()).equals(targetMonthDay)) {
                if (!hasActiveReminder(user.getId(), contact.getId(), Reminder.ReminderType.BIRTHDAY)) {
                    createReminder(user.getId(), contact.getId(), Reminder.ReminderType.BIRTHDAY,
                            LocalDateTime.of(LocalDate.now(), LocalTime.of(9, 0)));
                }
            }
        }
    }

    private void generateAnniversaryReminders(User user) {
        int daysBefore = getAnniversaryReminderDays(user);
        LocalDate targetDate = LocalDate.now().plusDays(daysBefore);
        MonthDay targetMonthDay = MonthDay.from(targetDate);

        List<Contact> contacts = contactRepository.findByUserId(user.getId());
        for (Contact contact : contacts) {
            if (contact.getAnniversary() != null && MonthDay.from(contact.getAnniversary()).equals(targetMonthDay)) {
                if (!hasActiveReminder(user.getId(), contact.getId(), Reminder.ReminderType.ANNIVERSARY)) {
                    createReminder(user.getId(), contact.getId(), Reminder.ReminderType.ANNIVERSARY,
                            LocalDateTime.of(LocalDate.now(), LocalTime.of(9, 0)));
                }
            }
        }
    }

    private void generateNoContactReminders(User user) {
        int noContactDays = getDefaultFollowupDays(user);
        LocalDateTime threshold = LocalDateTime.now().minusDays(noContactDays);

        List<Contact> contacts = contactRepository.findByUserId(user.getId());
        for (Contact contact : contacts) {
            if (contact.getLastContactedAt() == null || contact.getLastContactedAt().isBefore(threshold)) {
                if (!hasActiveReminder(user.getId(), contact.getId(), Reminder.ReminderType.NO_CONTACT)) {
                    createReminder(user.getId(), contact.getId(), Reminder.ReminderType.NO_CONTACT,
                            LocalDateTime.of(LocalDate.now(), LocalTime.of(9, 0)));
                }
            }
        }
    }

    private void createReminder(String userId, String contactId, Reminder.ReminderType type, LocalDateTime scheduledAt) {
        Reminder reminder = new Reminder();
        reminder.setUserId(userId);
        reminder.setContactId(contactId);
        reminder.setType(type);
        reminder.setScheduledAt(scheduledAt);
        reminder.setStatus(Reminder.ReminderStatus.PENDING);
        reminderRepository.save(reminder);
    }

    private boolean hasActiveReminder(String userId, String contactId, Reminder.ReminderType type) {
        return reminderRepository.findByUserIdAndStatus(userId, Reminder.ReminderStatus.PENDING).stream()
                .anyMatch(r -> r.getContactId().equals(contactId) && r.getType() == type);
    }

    private LocalDate getNextOccurrence(LocalDate date) {
        LocalDate thisYear = date.withYear(LocalDate.now().getYear());
        if (thisYear.isBefore(LocalDate.now())) {
            return thisYear.plusYears(1);
        }
        return thisYear;
    }

    private int getBirthdayReminderDays(User user) {
        return getSettingInt(user, "birthdayReminderDays", 2);
    }

    private int getAnniversaryReminderDays(User user) {
        return getSettingInt(user, "anniversaryReminderDays", 2);
    }

    private int getDefaultFollowupDays(User user) {
        return getSettingInt(user, "defaultFollowupDays", 30);
    }

    private int getSettingInt(User user, String key, int defaultValue) {
        if (user.getSettings() == null) return defaultValue;
        try {
            JsonNode node = objectMapper.readTree(user.getSettings());
            return node.has(key) ? node.get(key).asInt(defaultValue) : defaultValue;
        } catch (JsonProcessingException e) {
            return defaultValue;
        }
    }
}
