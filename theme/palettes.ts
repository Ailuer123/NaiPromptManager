export type ThemeId =
  | 'yunding'
  | 'lianrong'
  | 'bingshuang'
  | 'naika'
  | 'nainai'
  | 'wumei'
  | 'oz'
  | 'emerald'
  | 'mizhi'
  | 'peach'
  | 'cheese'
  | 'ximei'
  | 'jihan'
  | 'jiaotang'
  | 'provence'
  | 'cappuccino'
  | 'luan';

export type PaletteColors = readonly [string, string, string, string];

export interface ThemePalette {
  id: ThemeId;
  name: string;
  eng: string;
  colors: PaletteColors;
}

export const DEFAULT_THEME_ID: ThemeId = 'oz';

export const THEME_CATALOG: readonly ThemePalette[] = [
  { id: 'yunding', name: '云顶青山', eng: 'Cloud Peak', colors: ['#7D7D7F', '#C8CFD7', '#F2F0E1', '#DDDCDA'] },
  { id: 'lianrong', name: '莲蓉汤圆', eng: 'Lotus Paste', colors: ['#5C5C5A', '#9C918D', '#C8C7C2', '#FDF9EE'] },
  { id: 'bingshuang', name: '冷若冰霜', eng: 'Frost', colors: ['#415371', '#78ABCF', '#B0CFE6', '#E0DDEF'] },
  { id: 'naika', name: '奶咖飘香', eng: 'Milk Coffee', colors: ['#75584E', '#3A303D', '#80A1A0', '#D4C7B9'] },
  { id: 'nainai', name: '半熟奶昔', eng: 'Soft Shake', colors: ['#6D8762', '#BACF94', '#F5DAD1', '#FCFFE0'] },
  { id: 'wumei', name: '乌梅浆果', eng: 'Plum Berry', colors: ['#4F273B', '#A8789A', '#E0D4C8', '#A7C7D6'] },
  { id: 'oz', name: '雾霾玫瑰', eng: 'Morandi Glass', colors: ['#8f7284', '#a98c9c', '#94a391', '#8da3ae'] },
  { id: 'emerald', name: '绿野仙踪', eng: 'Emerald Oz', colors: ['#37826E', '#90C292', '#A2DBCE', '#F0FAB6'] },
  { id: 'mizhi', name: '蜜汁西点', eng: 'Honey Pastry', colors: ['#4E594C', '#877058', '#FA98A5', '#E6E1D4'] },
  { id: 'peach', name: '白桃气泡', eng: 'Peach Soda', colors: ['#EBAFB5', '#F8CED2', '#FAE6DB', '#DBE1DD'] },
  { id: 'cheese', name: '芝士布丁', eng: 'Cheese Pudding', colors: ['#5A5A5C', '#D4CDC3', '#D7DCE2', '#FCF2E6'] },
  { id: 'ximei', name: '冰沙西梅', eng: 'Plum Smoothie', colors: ['#374A5C', '#52A7BF', '#F2CBDD', '#FAF3EE'] },
  { id: 'jihan', name: '极寒之地', eng: 'Polar Land', colors: ['#6B7280', '#A8B4C4', '#E8ECF0', '#F5F6F8'] },
  { id: 'jiaotang', name: '焦糖布丁', eng: 'Caramel', colors: ['#5E504A', '#D6CABA', '#D7DFE2', '#F4F7E7'] },
  { id: 'provence', name: '普罗旺斯', eng: 'Provence', colors: ['#504657', '#7D726E', '#D5C3DE', '#FAEEEE'] },
  { id: 'cappuccino', name: '卡布奇诺', eng: 'Cappuccino', colors: ['#4F5957', '#9C988D', '#C3C8C7', '#FDF0EE'] },
  { id: 'luan', name: '乱世佳人', eng: 'Scarlett', colors: ['#615050', '#7C6C83', '#CCD1C6', '#FFF6E3'] },
];

export function themeById(id: string): ThemePalette {
  return THEME_CATALOG.find((t) => t.id === id)
    ?? THEME_CATALOG.find((t) => t.id === DEFAULT_THEME_ID)!;
}
