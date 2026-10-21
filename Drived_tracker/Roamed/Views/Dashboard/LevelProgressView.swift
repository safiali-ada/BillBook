import SwiftUI

struct LevelProgressView: View {
    let userProfile: UserProfile
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                VStack(alignment: .leading) {
                    Text("Level \(userProfile.currentLevel.id)")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                    Text(userProfile.currentLevel.title)
                        .font(.title2.bold())
                }
                Spacer()
                
                if let multiplier = userProfile.prestigeMultiplier {
                    Text("×\(multiplier)")
                        .font(.headline)
                        .foregroundStyle(.orange)
                } else {
                    Text("\(Int(userProfile.levelProgress * 100))%")
                        .font(.headline)
                        .foregroundStyle(.orange)
                }
            }
            
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule()
                        .fill(Color(.tertiarySystemFill))
                    
                    Capsule()
                        .fill(LinearGradient(colors: [.orange, .red], startPoint: .leading, endPoint: .trailing))
                        .frame(width: max(0, geometry.size.width * CGFloat(userProfile.levelProgress)))
                }
            }
            .frame(height: 12)
            
            if let nextText = userProfile.distanceToNextLevel {
                Text(nextText)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            } else {
                Text("Max level reached!")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding()
        .background(Color(.secondarySystemBackground))
        .cornerRadius(16)
    }
}
