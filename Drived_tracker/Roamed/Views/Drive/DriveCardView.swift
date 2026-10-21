import SwiftUI

struct DriveCardView: View {
    let distance: String
    let levelTitle: String
    let streakCount: Int
    let moodEmoji: String?
    
    var body: some View {
        VStack {
            Spacer()
            
            VStack(spacing: 8) {
                if let emoji = moodEmoji {
                    Text(emoji)
                        .font(.system(size: 60))
                }
                
                Text(distance)
                    .font(.system(size: 80, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                
                Text("driven today")
                    .font(.title3)
                    .foregroundStyle(.white.opacity(0.8))
            }
            
            Spacer()
            
            HStack {
                VStack(alignment: .leading) {
                    Text("Level")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    Text(levelTitle)
                        .font(.headline)
                        .foregroundStyle(.white)
                }
                
                Spacer()
                
                VStack(alignment: .trailing) {
                    Text("Streak")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.7))
                    Text("🔥 \(streakCount)")
                        .font(.headline)
                        .foregroundStyle(.white)
                }
            }
            .padding(24)
            .background(.thinMaterial)
            .cornerRadius(20)
            .padding()
            
            Text("ROAMED")
                .font(.caption.weight(.black))
                .tracking(5)
                .foregroundStyle(.white.opacity(0.5))
                .padding(.bottom)
        }
        .frame(width: 390, height: 693)
        .background(
            LinearGradient(
                colors: [Color(red: 0.1, green: 0.1, blue: 0.15), Color.black],
                startPoint: .top,
                endPoint: .bottom
            )
        )
    }
}
