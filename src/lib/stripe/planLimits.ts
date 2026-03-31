export const PLAN_LIMITS: Record<string, {
  maxReports: number
  maxProperties: number
  fullReport: boolean
  vertical: 'car' | 'home' | 'both'
}> = {
  free:           { maxReports: 0,  maxProperties: 2, fullReport: false, vertical: 'both' },
  car_single:     { maxReports: 1,  maxProperties: 2, fullReport: true,  vertical: 'car'  },
  car_pro_report: { maxReports: 1,  maxProperties: 4, fullReport: true,  vertical: 'car'  },
  car_pro10:      { maxReports: 10, maxProperties: 4, fullReport: true,  vertical: 'car'  },
  home_standard:  { maxReports: 1,  maxProperties: 2, fullReport: true,  vertical: 'home' },
  home_premium:   { maxReports: 1,  maxProperties: 3, fullReport: true,  vertical: 'home' },
  home_pro10:     { maxReports: 10, maxProperties: 3, fullReport: true,  vertical: 'home' },
}
