export type ThemeId =
  | 'bingshuang'
  | 'emerald'
  | 'yunding'
  | 'ximei'
  | 'jiaotang'
  | 'provence'
  | 'peach'
  | 'classic';

export type PaletteColors = readonly [string, string, string, string];

export interface ThemePalette {
  id: ThemeId;
  name: string;
  eng: string;
  colors: PaletteColors;
  /** 重构前白底灰面：纸面不染色，氛围也不铺渐变。 */
  flat?: boolean;
}

export const DEFAULT_THEME_ID: ThemeId = 'bingshuang';

export const THEME_CATALOG: readonly ThemePalette[] = [
  { id: 'bingshuang', name: '冷若冰霜', eng: 'Frost', colors: ['#415371', '#78ABCF', '#B0CFE6', '#E0DDEF'] },
  { id: 'emerald', name: '绿野仙踪', eng: 'Hatsune Mint', colors: ['#4A7873', '#9ED0CA', '#D4EEEA', '#F4FAF8'] },
  { id: 'yunding', name: '云顶青山', eng: 'Cloud Peak', colors: ['#7D7D7F', '#C8CFD7', '#F2F0E1', '#DDDCDA'] },
  { id: 'ximei', name: '冰沙西梅', eng: 'Plum Smoothie', colors: ['#374A5C', '#52A7BF', '#F2CBDD', '#FAF3EE'] },
  { id: 'jiaotang', name: '焦糖布丁', eng: 'Caramel', colors: ['#5E504A', '#D6CABA', '#D7DFE2', '#F4F7E7'] },
  { id: 'provence', name: '普罗旺斯', eng: 'Lavender', colors: ['#8E7A9C', '#C7B0D6', '#E5D8EC', '#F8F4FA'] },
  { id: 'peach', name: '白桃气泡', eng: 'Peach Soda', colors: ['#C08A96', '#E6B2BE', '#F3D4DA', '#FFF5F4'] },
  { id: 'classic', name: '经典靛蓝', eng: 'Classic', colors: ['#312E81', '#4F46E5', '#E5E7EB', '#FFFFFF'], flat: true },
];

export function themeById(id: string): ThemePalette {
  return THEME_CATALOG.find((t) => t.id === id)
    ?? THEME_CATALOG.find((t) => t.id === DEFAULT_THEME_ID)!;
}
