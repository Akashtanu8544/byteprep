class HapticService {
  private enabled: boolean = true;

  public setEnabled(enabled: boolean) {
    this.enabled = enabled;
  }

  public vibrate(pattern: number | number[]) {
    if (!this.enabled) return;
    if (typeof window !== 'undefined' && 'navigator' in window && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Ignore if unsupported or blocked by user gesture policy
      }
    }
  }

  public light() {
    this.vibrate(20);
  }

  public medium() {
    this.vibrate(40);
  }

  public heavy() {
    this.vibrate(80);
  }

  public correct() {
    this.vibrate([30, 50, 60]);
  }

  public incorrect() {
    this.vibrate([80, 40, 80]);
  }

  public timesUp() {
    this.vibrate([100, 50, 100, 50, 150]);
  }
}

export const hapticService = new HapticService();
