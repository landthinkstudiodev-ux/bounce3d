export interface DailyMission {
  id: string;
  titleKey: string;
  target: number;
  progress: number;
  rewardScore: number;
  completed: boolean;
  claimed: boolean;
}

const STORAGE_KEY = 'bounce_daily_missions_v1';
const STORAGE_DATE_KEY = 'bounce_daily_date_v1';

export function getTodayDateString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function loadDailyMissions(): DailyMission[] {
  try {
    const today = getTodayDateString();
    const savedDate = localStorage.getItem(STORAGE_DATE_KEY);
    const savedData = localStorage.getItem(STORAGE_KEY);

    if (savedDate === today && savedData) {
      return JSON.parse(savedData);
    }

    // Generate fresh missions for today
    const fresh: DailyMission[] = [
      {
        id: 'collect_rings',
        titleKey: 'missionRings',
        target: 20,
        progress: 0,
        rewardScore: 1000,
        completed: false,
        claimed: false,
      },
      {
        id: 'clear_stages',
        titleKey: 'missionStages',
        target: 2,
        progress: 0,
        rewardScore: 1500,
        completed: false,
        claimed: false,
      },
      {
        id: 'speed_run',
        titleKey: 'missionSpeed',
        target: 1,
        progress: 0,
        rewardScore: 2000,
        completed: false,
        claimed: false,
      },
    ];

    localStorage.setItem(STORAGE_DATE_KEY, today);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  } catch {
    return [];
  }
}

export function saveDailyMissions(missions: DailyMission[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(missions));
  } catch {
    // ignore
  }
}

export function updateMissionProgress(missionId: string, amount: number): DailyMission[] {
  const missions = loadDailyMissions();
  let updated = false;

  const next = missions.map((m) => {
    if (m.id === missionId && !m.completed) {
      const newProg = Math.min(m.target, m.progress + amount);
      const isDone = newProg >= m.target;
      updated = true;
      return {
        ...m,
        progress: newProg,
        completed: isDone,
      };
    }
    return m;
  });

  if (updated) {
    saveDailyMissions(next);
  }
  return next;
}
