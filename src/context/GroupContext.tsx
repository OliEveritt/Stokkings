"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useFirebaseAuth } from "./FirebaseAuthContext";

interface GroupContextType {
  activeGroup: any | null;
  allGroups: any[]; 
  loading: boolean;
  switchGroup: (groupId: string) => void;
}

const GroupContext = createContext<GroupContextType>({ 
  activeGroup: null, 
  allGroups: [],
  loading: true,
  switchGroup: () => {} 
});

export const GroupProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useFirebaseAuth();
  const [allGroups, setAllGroups] = useState<any[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setAllGroups([]);
      setLoading(false);
      return;
    }

    const q = query(collection(db, "groups"), where("members", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const groupsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllGroups(groupsData);
      
      if (groupsData.length > 0 && !activeGroupId) {
        setActiveGroupId(groupsData[0].id);
      }
      setLoading(false);
    }, (error) => {
      console.error("Context Sync Error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, activeGroupId]);

  const activeGroup = useMemo(() => {
    return allGroups.find(g => g.id === activeGroupId) || null;
  }, [allGroups, activeGroupId]);

  const switchGroup = (groupId: string) => {
    setActiveGroupId(groupId);
  };

  return (
    <GroupContext.Provider value={{ activeGroup, allGroups, loading, switchGroup }}>
      {children}
    </GroupContext.Provider>
  );
};

export const useActiveGroup = () => useContext(GroupContext);