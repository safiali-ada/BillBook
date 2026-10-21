import Foundation
import HealthKit
import Observation

@Observable
final class HealthKitService {
    
    private let healthStore = HKHealthStore()
    
    var isAuthorized: Bool = false
    
    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }
    
    func requestAuthorization() async {
        guard isAvailable else { return }
        
        let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        let typesToShare: Set = [mindfulType]
        
        do {
            try await healthStore.requestAuthorization(toShare: typesToShare, read: Set<HKObjectType>())
            await MainActor.run {
                self.isAuthorized = true
            }
        } catch {
            print("HealthKit authorization failed: \(error.localizedDescription)")
        }
    }
    
    func logMindfulDrive(drive: Drive) {
        guard isAuthorized, let mood = drive.mood, mood.isMindful else { return }
        
        let mindfulType = HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        
        let sample = HKCategorySample(
            type: mindfulType,
            value: 0,
            start: drive.startDate,
            end: drive.endDate
        )
        
        healthStore.save(sample) { success, error in
            if success {
                print("Successfully logged mindful drive to HealthKit.")
            } else if let error = error {
                print("Failed to log mindful drive: \(error.localizedDescription)")
            }
        }
    }
}
