"use client";

import {
  PROPS,
  getAvailableQuests, getActiveQuests, getCompletedQuests, getQuestState,
  startQuest,
} from "@/lib/game-state";

interface QuestLogOverlayProps {
  closeOverlay: () => void;
  showQuestNotif: (text: string) => void;
}

export function QuestLogOverlay({ closeOverlay, showQuestNotif }: QuestLogOverlayProps) {
  const available = getAvailableQuests();
  const active = getActiveQuests();
  const completed = getCompletedQuests();
  const qs = getQuestState();

  return (
    <div className="g3-overlay g3-overlay-center">
      <div className="g3-overlay-header">
        <span className="g3-overlay-title">QUEST LOG</span>
        <button className="g3-overlay-close" onClick={closeOverlay}>&#10005;</button>
      </div>
      <div className="g3-overlay-body g3-quest-log">
        {/* Active Quests */}
        {active.length > 0 && (
          <div className="g3-quest-section">
            <div className="g3-quest-section-title">ACTIVE QUESTS</div>
            {active.map(quest => {
              const progress = qs.questProgress[quest.id] || {};
              const doneCount = quest.objectives.filter(o => progress[o.id]).length;
              return (
                <div key={quest.id} className="g3-quest-card g3-quest-active">
                  <div className="g3-quest-card-header">
                    <span className="g3-quest-title">{quest.title}</span>
                    <span className="g3-quest-progress">{doneCount}/{quest.objectives.length}</span>
                  </div>
                  <p className="g3-quest-desc">{quest.description}</p>
                  <div className="g3-quest-objectives">
                    {quest.objectives.map(obj => (
                      <div key={obj.id} className={`g3-quest-obj ${progress[obj.id] ? "g3-quest-obj-done" : ""}`}>
                        <span className="g3-quest-obj-check">{progress[obj.id] ? "\u2713" : "\u25CB"}</span>
                        <span>{obj.description}</span>
                      </div>
                    ))}
                  </div>
                  <div className="g3-quest-reward">
                    Reward: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Available Quests */}
        {available.length > 0 && (
          <div className="g3-quest-section">
            <div className="g3-quest-section-title">AVAILABLE QUESTS</div>
            {available.map(quest => (
              <div key={quest.id} className="g3-quest-card g3-quest-available">
                <div className="g3-quest-card-header">
                  <span className="g3-quest-title">{quest.title}</span>
                  <span className="g3-quest-giver">From: {quest.giverNpc === "vinny" ? "Vinny" : quest.giverNpc === "charlie" ? "Charlie" : "Customer"}</span>
                </div>
                <p className="g3-quest-desc">{quest.description}</p>
                <div className="g3-quest-reward">
                  Reward: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                </div>
                <button className="g3-quest-accept" onClick={() => {
                  startQuest(quest.id);
                  showQuestNotif(`Quest Started: ${quest.title}`);
                  closeOverlay();
                }}>ACCEPT QUEST</button>
              </div>
            ))}
          </div>
        )}

        {/* Completed Quests */}
        {completed.length > 0 && (
          <div className="g3-quest-section">
            <div className="g3-quest-section-title">COMPLETED</div>
            {completed.map(quest => (
              <div key={quest.id} className="g3-quest-card g3-quest-completed">
                <div className="g3-quest-card-header">
                  <span className="g3-quest-title">{quest.title}</span>
                  <span className="g3-quest-check-done">{"\u2713"}</span>
                </div>
                <p className="g3-quest-desc">{quest.description}</p>
                <div className="g3-quest-reward">
                  Earned: {quest.reward.xp} XP{quest.reward.propId ? ` + ${PROPS.find(p => p.id === quest.reward.propId)?.name || "Prop"}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}

        {active.length === 0 && available.length === 0 && completed.length === 0 && (
          <div className="g3-quest-empty">No quests yet. Talk to Vinny to get started!</div>
        )}
      </div>
    </div>
  );
}
