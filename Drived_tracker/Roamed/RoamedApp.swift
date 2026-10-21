import SwiftUI
import SwiftData
import TipKit

@main
struct RoamedApp: App {
    
    init() {
        try? Tips.configure([
            .displayFrequency(.immediate),
            .datastoreLocation(.applicationDefault)
        ])
    }
    
    var sharedModelContainer: ModelContainer = {
        let schema = Schema([
            Drive.self,
            UserProfile.self,
            Badge.self,
        ])
        
        let groupURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: "group.com.roamed.app")!
        let storeURL = groupURL.appendingPathComponent("Roamed.sqlite")
        let modelConfiguration = ModelConfiguration(schema: schema, url: storeURL)
        
        do {
            return try ModelContainer(for: schema, configurations: [modelConfiguration])
        } catch {
            fatalError("Could not create ModelContainer: \(error)")
        }
    }()
    
    @State private var driveService = DriveDetectionService()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(driveService)
                .onAppear {
                    driveService.modelContext = sharedModelContainer.mainContext
                    driveService.startMonitoring()
                }
        }
        .modelContainer(sharedModelContainer)
    }
}
