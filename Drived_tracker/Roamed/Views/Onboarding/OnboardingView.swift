import SwiftUI
import SwiftData

struct OnboardingView: View {
    @Environment(\.modelContext) private var modelContext
    @State private var selectedTab = 0
    
    var body: some View {
        TabView(selection: $selectedTab) {
            OnboardingPage(
                icon: "car.fill",
                title: "Track Every Kilometer",
                subtitle: "Roamed automatically logs your drives in the background. Build a comprehensive history of your life on the road."
            )
            .tag(0)
            
            OnboardingPage(
                icon: "medal.fill",
                title: "Level Up Your Drives",
                subtitle: "Earn badges, maintain streaks, and level up from your neighborhood to the whole globe."
            )
            .tag(1)
            
            VStack {
                OnboardingPage(
                    icon: "lock.shield.fill",
                    title: "Your Privacy, Always",
                    subtitle: "All data stays securely on your device. No servers, no GPS tracking, no ads. Just your driving stats."
                )
                
                Button(action: finishOnboarding) {
                    Text("Get Started")
                        .font(.headline)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.orange)
                        .foregroundStyle(.white)
                        .cornerRadius(14)
                }
                .padding(.horizontal, 40)
                .padding(.bottom, 40)
            }
            .tag(2)
        }
        .tabViewStyle(.page)
        .indexViewStyle(.page(backgroundDisplayMode: .always))
        .background(Color(.systemBackground))
    }
    
    private func finishOnboarding() {
        let newUser = UserProfile()
        newUser.hasCompletedOnboarding = true
        modelContext.insert(newUser)
    }
}

struct OnboardingPage: View {
    let icon: String
    let title: String
    let subtitle: String
    
    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: icon)
                .font(.system(size: 100))
                .foregroundStyle(Color.orange.gradient)
                .padding(.bottom, 20)
            
            Text(title)
                .font(.title.bold())
                .multilineTextAlignment(.center)
            
            Text(subtitle)
                .font(.body)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 40)
        }
    }
}
