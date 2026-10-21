import Foundation
import CoreMotion
import CoreLocation
import SwiftData
import Observation
import OSLog

@Observable
final class DriveDetectionService: NSObject, CLLocationManagerDelegate {
    enum DriveState {
        case idle
        case driving
        case processing
    }

    var currentState: DriveState = .idle
    var modelContext: ModelContext?
    
    private let activityManager = CMMotionActivityManager()
    private let locationManager = CLLocationManager()
    private let logger = Logger(subsystem: "com.roamed.app", category: "DriveDetection")
    
    private var driveLocations: [CLLocation] = []
    private var driveStartDate: Date?
    
    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.allowsBackgroundLocationUpdates = true
        locationManager.showsBackgroundLocationIndicator = false
        locationManager.pausesLocationUpdatesAutomatically = true
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.activityType = .automotiveNavigation
    }
    
    func startMonitoring() {
        locationManager.requestAlwaysAuthorization()
        
        // Always monitor significant location changes so the app wakes up in the background
        locationManager.startMonitoringSignificantLocationChanges()
        
        guard CMMotionActivityManager.isActivityAvailable() else {
            logger.error("Motion activity not available")
            return
        }
        
        activityManager.startActivityUpdates(to: .main) { [weak self] activity in
            guard let self = self, let activity = activity else { return }
            
            if activity.automotive {
                if self.currentState == .idle {
                    self.startDrive()
                }
            } else if activity.walking || activity.running || activity.stationary || activity.cycling {
                if self.currentState == .driving {
                    self.stopDrive()
                }
            }
        }
    }
    
    func stopMonitoring() {
        activityManager.stopActivityUpdates()
        locationManager.stopMonitoringSignificantLocationChanges()
        if currentState == .driving {
            currentState = .idle
        }
    }
    
    func startDrive() {
        logger.info("Drive started")
        currentState = .driving
        driveStartDate = Date()
        driveLocations.removeAll()
        
        // Turn ON precise GPS tracking during the drive
        locationManager.startUpdatingLocation()
    }
    
    func stopDrive() {
        logger.info("Drive stopped")
        currentState = .processing
        
        // Turn OFF precise GPS tracking to save battery
        locationManager.stopUpdatingLocation()
        
        let startDate = driveStartDate ?? Date()
        let endDate = Date()
        let locations = driveLocations
        
        Task {
            await processDrive(startDate: startDate, endDate: endDate, locations: locations)
            await MainActor.run {
                self.currentState = .idle
            }
        }
    }
    
    private func processDrive(startDate: Date, endDate: Date, locations: [CLLocation]) async {
        let totalDistance: Double = {
            guard locations.count > 1 else { return 0 }
            var sum: Double = 0
            for i in 1..<locations.count {
                sum += locations[i].distance(from: locations[i-1])
            }
            return sum
        }()
        
        // Ignore extremely short drives (< 100 meters)
        guard totalDistance > 100 else {
            logger.info("Drive discarded, distance too short: \(totalDistance)m")
            return
        }
        
        let capturedDistance = totalDistance
        await MainActor.run {
            guard let context = self.modelContext else {
                logger.error("ModelContext not set, unable to save drive")
                return
            }
            
            let drive = Drive(
                startDate: startDate,
                endDate: endDate,
                distanceMeters: capturedDistance,
                wasDriver: true, // This could be updated by DriverDetectionService
                hadPhoneInteraction: false
            )
            
            context.insert(drive)
            do {
                try context.save()
                logger.info("Drive saved successfully: \(capturedDistance)m")
            } catch {
                logger.error("Failed to save drive: \(error.localizedDescription)")
            }
        }
    }
    
    // MARK: - CLLocationManagerDelegate
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        if currentState == .driving {
            driveLocations.append(contentsOf: locations)
        }
    }
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        logger.error("Location manager failed: \(error.localizedDescription)")
    }
}
