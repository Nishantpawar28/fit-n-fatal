'use client';

import { useState, Suspense } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Star, Trash2 } from 'lucide-react';
import {
  getFoods,
  createFood,
  deleteFood,
  toggleFavoriteFood,
  createFoodEntry,
} from '@fit-n-fatal/db';
import type { Food, MealType } from '@fit-n-fatal/db';
import { Button, Input, Modal, Select } from '@/components/ui';
import { MEAL_TYPE_LABELS, MEAL_TYPES } from '@fit-n-fatal/utils';

export function AddFoodModal({
  open,
  onClose,
  userId,
  entryDate,
  defaultMeal,
}: {
  open: boolean;
  onClose: () => void;
  userId: string;
  entryDate: string;
  defaultMeal: MealType;
}) {
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<'search' | 'quick' | 'new'>('search');
  const [mealType, setMealType] = useState<MealType>(defaultMeal);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState('1');

  const [quickName, setQuickName] = useState('');
  const [quickCalories, setQuickCalories] = useState('');
  const [quickProtein, setQuickProtein] = useState('');
  const [quickCarbs, setQuickCarbs] = useState('');
  const [quickFat, setQuickFat] = useState('');

  const [newName, setNewName] = useState('');
  const [newServing, setNewServing] = useState('');
  const [newCalories, setNewCalories] = useState('');
  const [newProtein, setNewProtein] = useState('');
  const [newCarbs, setNewCarbs] = useState('');
  const [newFat, setNewFat] = useState('');

  const { data: foods } = useQuery({
    queryKey: ['foods', userId, search],
    queryFn: () => getFoods(userId, search),
    enabled: open && mode === 'search',
  });

  const invalidateEntries = () => {
    queryClient.invalidateQueries({ queryKey: ['foodEntries'] });
    queryClient.invalidateQueries({ queryKey: ['foods'] });
  };

  const addFromFoodMutation = useMutation({
    mutationFn: () => {
      const qty = parseFloat(quantity) || 1;
      return createFoodEntry(userId, {
        foodId: selectedFood!.id,
        name: selectedFood!.name,
        mealType,
        quantity: qty,
        calories: selectedFood!.calories * qty,
        protein: selectedFood!.protein * qty,
        carbs: selectedFood!.carbs * qty,
        fat: selectedFood!.fat * qty,
        entryDate,
      });
    },
    onSuccess: () => { invalidateEntries(); reset(); onClose(); },
  });

  const quickAddMutation = useMutation({
    mutationFn: () =>
      createFoodEntry(userId, {
        name: quickName || 'Quick add',
        mealType,
        quantity: 1,
        calories: parseFloat(quickCalories) || 0,
        protein: parseFloat(quickProtein) || 0,
        carbs: parseFloat(quickCarbs) || 0,
        fat: parseFloat(quickFat) || 0,
        entryDate,
      }),
    onSuccess: () => { invalidateEntries(); reset(); onClose(); },
  });

  const newFoodMutation = useMutation({
    mutationFn: async () => {
      const food = await createFood(userId, {
        name: newName,
        servingSize: newServing || undefined,
        calories: parseFloat(newCalories) || 0,
        protein: parseFloat(newProtein) || 0,
        carbs: parseFloat(newCarbs) || 0,
        fat: parseFloat(newFat) || 0,
      });
      return createFoodEntry(userId, {
        foodId: food.id,
        name: food.name,
        mealType,
        quantity: 1,
        calories: food.calories,
        protein: food.protein,
        carbs: food.carbs,
        fat: food.fat,
        entryDate,
      });
    },
    onSuccess: () => { invalidateEntries(); reset(); onClose(); },
  });

  const deleteFoodMutation = useMutation({
    mutationFn: (id: string) => deleteFood(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foods'] }),
  });

  const favMutation = useMutation({
    mutationFn: ({ id, fav }: { id: string; fav: boolean }) => toggleFavoriteFood(id, fav),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foods'] }),
  });

  const reset = () => {
    setSelectedFood(null);
    setQuantity('1');
    setQuickName(''); setQuickCalories(''); setQuickProtein(''); setQuickCarbs(''); setQuickFat('');
    setNewName(''); setNewServing(''); setNewCalories(''); setNewProtein(''); setNewCarbs(''); setNewFat('');
  };

  const sortedFoods = (foods ?? []).slice().sort((a, b) => Number(b.is_favorite) - Number(a.is_favorite));

  return (
    <Modal open={open} onClose={onClose} title="Add Food">
      <div className="flex gap-2 mb-4">
        {(['search', 'quick', 'new'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`text-xs px-3 py-1.5 rounded-full ${mode === m ? 'bg-purple-500/25 text-fnf-violet' : 'text-fnf-muted hover:bg-white/5'}`}
          >
            {m === 'search' ? 'Library' : m === 'quick' ? 'Quick Add' : 'New Food'}
          </button>
        ))}
      </div>

      <Select value={mealType} onChange={(v) => setMealType(v as MealType)} options={MEAL_TYPES.map((m) => ({ value: m, label: MEAL_TYPE_LABELS[m] }))} className="mb-3" />

      {mode === 'search' && (
        <div>
          <Input value={search} onChange={setSearch} placeholder="Search your foods..." className="mb-3" />
          <div className="max-h-56 overflow-y-auto space-y-1 mb-3">
            {sortedFoods.map((f) => (
              <div
                key={f.id}
                onClick={() => setSelectedFood(f)}
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-sm ${selectedFood?.id === f.id ? 'bg-purple-500/20' : 'hover:bg-white/5'}`}
              >
                <div className="min-w-0">
                  <p className="text-fnf-text truncate">{f.name} {f.serving_size ? <span className="text-fnf-muted text-xs">({f.serving_size})</span> : null}</p>
                  <p className="text-fnf-muted text-xs">{f.calories} kcal · {f.protein}g protein</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); favMutation.mutate({ id: f.id, fav: !f.is_favorite }); }} className={f.is_favorite ? 'text-fnf-violet' : 'text-fnf-muted'}>
                    <Star size={13} fill={f.is_favorite ? 'currentColor' : 'none'} />
                  </button>
                  {f.user_id === userId && (
                    <button onClick={(e) => { e.stopPropagation(); deleteFoodMutation.mutate(f.id); }} className="text-fnf-muted hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sortedFoods.length === 0 && <p className="text-fnf-muted text-xs p-2">No foods found. Try Quick Add or New Food.</p>}
          </div>
          {selectedFood && (
            <div className="flex items-center gap-2 mb-3">
              <Input value={quantity} onChange={setQuantity} type="number" placeholder="Qty" className="w-20" />
              <span className="text-fnf-muted text-xs">× serving = {Math.round(selectedFood.calories * (parseFloat(quantity) || 1))} kcal</span>
            </div>
          )}
          <Button className="w-full" disabled={!selectedFood || addFromFoodMutation.isPending} onClick={() => addFromFoodMutation.mutate()}>
            Add to {MEAL_TYPE_LABELS[mealType]}
          </Button>
        </div>
      )}

      {mode === 'quick' && (
        <div className="space-y-3">
          <Input value={quickName} onChange={setQuickName} placeholder="What did you eat?" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={quickCalories} onChange={setQuickCalories} type="number" placeholder="Calories" />
            <Input value={quickProtein} onChange={setQuickProtein} type="number" placeholder="Protein (g)" />
            <Input value={quickCarbs} onChange={setQuickCarbs} type="number" placeholder="Carbs (g, optional)" />
            <Input value={quickFat} onChange={setQuickFat} type="number" placeholder="Fat (g, optional)" />
          </div>
          <Button className="w-full" disabled={!quickCalories || quickAddMutation.isPending} onClick={() => quickAddMutation.mutate()}>
            Add to {MEAL_TYPE_LABELS[mealType]}
          </Button>
        </div>
      )}

      {mode === 'new' && (
        <div className="space-y-3">
          <Input value={newName} onChange={setNewName} placeholder="Food name" />
          <Input value={newServing} onChange={setNewServing} placeholder="Serving size (e.g. 100g)" />
          <div className="grid grid-cols-2 gap-3">
            <Input value={newCalories} onChange={setNewCalories} type="number" placeholder="Calories" />
            <Input value={newProtein} onChange={setNewProtein} type="number" placeholder="Protein (g)" />
            <Input value={newCarbs} onChange={setNewCarbs} type="number" placeholder="Carbs (g)" />
            <Input value={newFat} onChange={setNewFat} type="number" placeholder="Fat (g)" />
          </div>
          <Button className="w-full" disabled={!newName || newFoodMutation.isPending} onClick={() => newFoodMutation.mutate()}>
            Save to Library &amp; Add to {MEAL_TYPE_LABELS[mealType]}
          </Button>
        </div>
      )}
    </Modal>
  );
}
