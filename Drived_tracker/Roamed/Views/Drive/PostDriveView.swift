import SwiftUI

struct PostDriveView: View {
    let drive: Drive
    @Environment(\.dismiss) private var dismiss
    @State private var selectedMood: DriveMood?
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 30) {
                Text("Drive Complete!")
                    .font(.largeTitle.bold())
                
                HStack(spacing: 40) {
                    VStack {
                        Text(String(format: "%.1f", drive.distanceKm))
                            .font(.system(size: 50, weight: .bold))
                        Text("km")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }
                    
                    VStack {
                        Text(formatDuration(drive.duration))
                            .font(.system(size: 50, weight: .bold))
                        Text("duration")
                            .font(.title2)
                            .foregroundStyle(.secondary)
                    }
                }
                
                VStack(alignment: .leading, spacing: 16) {
                    Text("How was the drive?")
                        .font(.headline)
                    
                    HStack {
                        ForEach(DriveMood.allCases) { mood in
                            Button {
                                selectedMood = mood
                                drive.mood = mood
                            } label: {
                                VStack {
                                    Text(mood.emoji)
                                        .font(.largeTitle)
                                    Text(mood.label)
                                        .font(.caption)
                                }
                                .padding()
                                .background(selectedMood == mood ? mood.color.opacity(0.3) : Color(.secondarySystemBackground))
                                .cornerRadius(12)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                }
                
                Spacer()
                
                HStack {
                    Button("Skip") {
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color(.secondarySystemBackground))
                    .cornerRadius(12)
                    
                    Button("Save") {
                        dismiss()
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.orange)
                    .foregroundStyle(.white)
                    .cornerRadius(12)
                }
                .font(.headline)
            }
            .padding()
        }
    }
    
    private func formatDuration(_ duration: TimeInterval) -> String {
        let minutes = Int(duration) / 60
        return "\(minutes)m"
    }
}
