import SwiftUI
import SwiftData

struct SettingsView: View {
    @Query private var users: [UserProfile]
    @Environment(\.modelContext) private var modelContext
    @Environment(DriveDetectionService.self) private var driveService
    @State private var showingResetAlert = false
    
    private var userProfile: UserProfile? {
        users.first
    }
    
    var body: some View {
        NavigationStack {
            Form {
                if let profile = userProfile {
                    Section("Units") {
                        Picker("Distance Unit", selection: Bindable(profile).prefersKilometers) {
                            Text("Kilometers").tag(true)
                            Text("Miles").tag(false)
                        }
                        .pickerStyle(.segmented)
                    }
                    
                    Section("Tracking") {
                        Toggle("Mood Tracking", isOn: Bindable(profile).moodTrackingEnabled)
                        Toggle("HealthKit Integration", isOn: Bindable(profile).healthKitEnabled)
                        Toggle("iCloud Sync", isOn: Bindable(profile).iCloudSyncEnabled)
                    }
                }
                
                Section("Saved Cars") {
                    Text("My Car (Bluetooth)")
                    Text("Wife's Car (Bluetooth)")
                }
                
                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text("1.0.0")
                            .foregroundStyle(.secondary)
                    }
                    Button("Privacy Policy") {}
                    Button("Credits") {}
                }
                
                Section("Danger Zone") {
                    Button(role: .destructive) {
                        showingResetAlert = true
                    } label: {
                        Text("Reset All Data")
                    }
                }
                
                #if targetEnvironment(simulator)
                Section("Simulator Debug") {
                    if driveService.currentState == .driving {
                        Button("Stop & Save Test Drive") {
                            driveService.stopDrive()
                        }
                        .foregroundStyle(.blue)
                    } else {
                        Button("Start Test Drive") {
                            driveService.startDrive()
                        }
                        .foregroundStyle(.orange)
                    }
                }
                #endif
            }
            .navigationTitle("Settings")
            .alert("Reset All Data?", isPresented: $showingResetAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Reset", role: .destructive) {
                    // Perform reset logic here if needed
                }
            } message: {
                Text("This will permanently delete all your drives, badges, and stats. This action cannot be undone.")
            }
        }
    }
}
