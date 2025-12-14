export type Gender = 'Male' | 'Female';
export type Goal = 'Cut' | 'Maintain' | 'Bulk';
export type ActivityLevel = 1 | 2 | 3 | 4 | 5;

export interface UserProfile {
  gender: Gender;
  goal: Goal;
  age: number;
  weight: number; // lbs
  heightFt: number;
  heightIn: number;
  activityLevel: ActivityLevel;
}

export interface Macros {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type FoodState = 'Raw' | 'Cooked';

export interface FoodItem {
  id: string;
  name: string;
  weight: number; // grams
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
  timestamp: string; // HH:MM
  state?: FoodState;
}

export interface AppState {
  profile: UserProfile;
  targets: Macros;
  log: FoodItem[];
  setProfile: (profile: UserProfile) => void;
  addFood: (item: Omit<FoodItem, 'id'>) => void;
  removeFood: (id: string) => void;
  recalculateTargets: (profile: UserProfile) => void;
}
