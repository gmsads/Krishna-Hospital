import { Setting } from './setting.model.js';

export const getSettings = async (branchKey = 'Global') => {
  let settings = await Setting.findOne({ branchKey });
  if (!settings) {
    settings = await Setting.findOne({});
  }
  if (!settings) {
    settings = await Setting.create({ branchKey });
  }
  return settings;
};

export const getAllSettingsMap = async () => {
  const allList = await Setting.find({});
  const map = {};
  allList.forEach((item) => {
    map[item.branchKey || 'Global'] = item;
  });
  return map;
};

export const updateSettings = async (branchKey = 'Global', updateData) => {
  const keyToUse = branchKey || 'Global';
  const updated = await Setting.findOneAndUpdate(
    { branchKey: keyToUse },
    { ...updateData, branchKey: keyToUse },
    { new: true, upsert: true, runValidators: true }
  );
  return updated;
};
