import Foundation

struct StreakService {
    
    static func updateStreak(profile: UserProfile, driveDate: Date) {
        let calendar = Calendar.current
        
        // Check if freeze availability needs resetting (every Monday)
        if let lastFreeze = profile.lastStreakFreezeDate {
            if let nextMonday = calendar.nextDate(after: lastFreeze, matching: DateComponents(weekday: 2), matchingPolicy: .nextTime),
               driveDate >= nextMonday {
                profile.streakFreezeAvailable = true
            }
        }
        
        guard let lastDriveDate = profile.lastDriveDate else {
            // First drive
            profile.currentStreakDays = 1
            profile.longestStreakDays = 1
            return
        }
        
        let startOfToday = calendar.startOfDay(for: driveDate)
        let startOfLastDrive = calendar.startOfDay(for: lastDriveDate)
        let components = calendar.dateComponents([.day], from: startOfLastDrive, to: startOfToday)
        
        guard let daysPassed = components.day else { return }
        
        if daysPassed == 0 {
            // Same day, streak doesn't increase
            return
        } else if daysPassed == 1 {
            // Consecutive day
            profile.currentStreakDays += 1
        } else if daysPassed == 2 && profile.streakFreezeAvailable {
            // Missed one day, but has freeze
            profile.streakFreezeAvailable = false
            profile.lastStreakFreezeDate = driveDate
            profile.currentStreakDays += 1
        } else {
            // Streak broken
            profile.currentStreakDays = 1
        }
        
        if profile.currentStreakDays > profile.longestStreakDays {
            profile.longestStreakDays = profile.currentStreakDays
        }
    }
}
