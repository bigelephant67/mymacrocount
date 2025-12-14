import { UserProfile, Macros } from './types';

export const calculateTDEE = (profile: UserProfile): Macros => {
  // Convert to metric
  const weightKg = profile.weight * 0.453592;
  const heightCm = (profile.heightFt * 12 + profile.heightIn) * 2.54;
  
  // Mifflin-St Jeor Equation
  // BMR = 10W + 6.25H - 5A + 5 (Male)
  // BMR = 10W + 6.25H - 5A - 161 (Female)
  
  let bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age;
  bmr += profile.gender === 'Male' ? 5 : -161;

  // Activity Multiplier (1-5 mapped to 1.2 - 1.9)
  const multipliers = [1.2, 1.375, 1.55, 1.725, 1.9];
  const activityMultiplier = multipliers[profile.activityLevel - 1] || 1.2;

  let tdee = Math.round(bmr * activityMultiplier);

  // Adjust for Goal
  if (profile.goal === 'Cut') tdee -= 500;
  if (profile.goal === 'Bulk') tdee += 500;

  // Calculate Macros
  // Protein: 1g per lb of bodyweight (high protein for fitness focus)
  const protein = Math.round(profile.weight); 
  
  // Fat: 0.35g per lb
  const fat = Math.round(profile.weight * 0.35);

  // Carbs: Remaining calories
  // Protein = 4cal/g, Fat = 9cal/g, Carbs = 4cal/g
  const proteinCals = protein * 4;
  const fatCals = fat * 9;
  const remainingCals = tdee - (proteinCals + fatCals);
  const carbs = Math.max(0, Math.round(remainingCals / 4));

  return {
    calories: tdee,
    protein,
    fat,
    carbs
  };
};

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const getCurrentTime = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
};
