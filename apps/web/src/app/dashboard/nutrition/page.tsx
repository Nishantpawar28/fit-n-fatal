'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react';
import { getFoodEntriesForDate, deleteFoodEntry, sumNutrition } from '@fit-n-fatal/db';
import type { MealType } from '@fit-n-fatal/db';
import { Card, ProgressBar } from '@/components/ui';
import { useProfile } from '@/lib/use-profile';
import { MEAL_TYPE_LABELS, MEAL_TYPES, formatDate, toLocalDateStr, addDaysLocal } from '@fit-n-fatal/utils';
import { AddFoodModal } from '@/components/nutrition/add-food-modal';

function NutritionInner() {
  const searchParams = useSearchParams();
  const { userId, profile } = useProfile();
  const queryClient = useQueryClient();
  const [date, setDate] = useState(toLocalDateStr());
  const [modalMeal, setModalMeal] = useState<MealType | null>(null);

  const highlight = searchParams.get('q');

  const { data: entries } = useQuery({
    queryKey: ['foodEntries', userId, date],
    queryFn: () => getFoodEntriesForDate(userId!, date),
    enabled: !!userId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFoodEntry(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['foodEntries'] }),
  });

  const totals = sumNutrition(entries ?? []);
  const calorieGoal = profile?.daily_calorie_goal ?? 2200;
  const proteinGoal = profile?.daily_protein_goal ?? 150;
  const carbGoal = profile?.daily_carb_goal ?? 220;
  const fatGoal = profile?.daily_fat_goal ?? 70;
  const remaining = Math.max(0, calorieGoal - totals.calories);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading text-2xl font-bold text-fnf-text">Nutrition</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setDate((d) => addDaysLocal(d, -1))} className="text-fnf-muted hover:text-fnf-text p-1">
            <ChevronLeft size={18} />
          </button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-fnf-surface border border-purple-500/15 rounded-lg px-3 py-1.5 text-sm text-fnf-text" />
          <button onClick={() => setDate((d) => addDaysLocal(d, 1))} className="text-fnf-muted hover:text-fnf-text p-1">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <Card className="mb-6">
        <div className="flex justify-between mb-2">
          <p className="text-fnf-text font-medium">Today&apos;s Nutrition</p>
          <p className="text-fnf-muted text-xs">{remaining} kcal remaining</p>
        </div>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-fnf-secondary">Calories</span><span className="text-fnf-muted">{Math.round(totals.calories)} / {calorieGoal} kcal</span></div>
            <ProgressBar value={totals.calories} max={calorieGoal} color="purple" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-fnf-secondary">Protein</span><span className="text-fnf-muted">{Math.round(totals.protein)} / {proteinGoal} g</span></div>
            <ProgressBar value={totals.protein} max={proteinGoal} color="pink" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-fnf-secondary">Carbs</span><span className="text-fnf-muted">{Math.round(totals.carbs)} / {carbGoal} g</span></div>
            <ProgressBar value={totals.carbs} max={carbGoal} color="green" />
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-fnf-secondary">Fat</span><span className="text-fnf-muted">{Math.round(totals.fat)} / {fatGoal} g</span></div>
            <ProgressBar value={totals.fat} max={fatGoal} color="purple" />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {MEAL_TYPES.map((meal) => {
          const mealEntries = (entries ?? []).filter((e) => e.meal_type === meal);
          const mealTotals = sumNutrition(mealEntries);
          return (
            <Card key={meal}>
              <div className="flex justify-between items-center mb-2">
                <p className="font-medium text-fnf-text">{MEAL_TYPE_LABELS[meal]}</p>
                <div className="flex items-center gap-3">
                  <span className="text-fnf-muted text-xs">{Math.round(mealTotals.calories)} kcal</span>
                  <button onClick={() => setModalMeal(meal as MealType)} className="text-fnf-violet hover:bg-purple-500/10 rounded-full p-1">
                    <Plus size={16} />
                  </button>
                </div>
              </div>
              {mealEntries.length === 0 ? (
                <p className="text-fnf-muted text-xs">No items logged</p>
              ) : (
                <div className="space-y-1.5">
                  {mealEntries.map((e) => (
                    <div key={e.id} className={`flex justify-between items-center text-sm py-1 ${highlight && e.name.toLowerCase().includes(highlight.toLowerCase()) ? 'bg-purple-500/10 rounded-lg px-2' : ''}`}>
                      <div>
                        <span className="text-fnf-secondary">{e.name}</span>
                        <span className="text-fnf-muted text-xs ml-2">{e.calories} kcal · {e.protein}g P</span>
                      </div>
                      <button onClick={() => deleteMutation.mutate(e.id)} className="text-fnf-muted hover:text-red-400">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {userId && modalMeal && (
        <AddFoodModal open={!!modalMeal} onClose={() => setModalMeal(null)} userId={userId} entryDate={date} defaultMeal={modalMeal} />
      )}
    </div>
  );
}

export default function NutritionPage() {
  return (
    <Suspense fallback={null}>
      <NutritionInner />
    </Suspense>
  );
}
