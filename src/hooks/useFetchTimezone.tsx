// hooks/useFetchTimezone.ts

import { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";

const useFetchTimezone = () => {
  const [timeZone, setTimeZone] = useState<string>("local");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimezone = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.timeZone) {
            setTimeZone(data.timeZone);
          }
        }
      }
      setLoading(false);
    };

    fetchTimezone();
  }, []);

  return { timeZone, loading };
};

export default useFetchTimezone;
