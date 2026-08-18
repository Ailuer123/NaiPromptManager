
import React from 'react';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { cx } from './ui/cx';

interface CartItem {
    name: string;
    weight: number;
}

type ArtistWeightSyntax = 'numeric' | 'bracket';

interface ArtistLibraryCartProps {
    cart: CartItem[];
    updateWeight: (index: number, delta: number) => void;
    toggleCart: (name: string) => void;
    setCart: (cart: CartItem[]) => void;
    copyCart: () => void;
    formatTag: (item: CartItem) => string;
    weightSyntax: ArtistWeightSyntax;
}

export const ArtistLibraryCart: React.FC<ArtistLibraryCartProps> = ({
    cart, updateWeight, toggleCart, setCart, copyCart, formatTag, weightSyntax
}) => {
    return (
        <div className={cx('arsenal-cart', 'glass-strong', cart.length > 0 && 'open')}>
            <div className="arsenal-cart-inner">
                <div className="cart-items">
                    {cart.map((item, idx) => (
                        <div key={item.name} className="cart-pill">
                            <IconButton size="sm" label={`降低 ${item.name} 权重`} onClick={() => updateWeight(idx, -1)}>−</IconButton>
                            <span className="mono" title={formatTag(item)}>{formatTag(item)}</span>
                            <IconButton size="sm" label={`提高 ${item.name} 权重`} onClick={() => updateWeight(idx, 1)}>+</IconButton>
                            <IconButton size="sm" danger label={`移除 ${item.name}`} onClick={() => toggleCart(item.name)}>×</IconButton>
                        </div>
                    ))}
                </div>
                <div className="cart-meta">
                    <div>已选 <strong>{cart.length}</strong></div>
                    <div className="hint">
                        {weightSyntax === 'numeric' ? '数字权重 ±0.1' : '括号权重 ±1层'}
                    </div>
                </div>
                <div className="sheet-foot" style={{ marginTop: 0 }}>
                    <Button variant="ghost" size="sm" onClick={() => setCart([])}>清空</Button>
                    <Button size="sm" onClick={copyCart}>复制</Button>
                </div>
            </div>
        </div>
    );
};
