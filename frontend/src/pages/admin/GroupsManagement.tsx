import { setupIonicReact } from '@ionic/react';
setupIonicReact();

/**
 * Functional summary.
 *
 * Groups management page for administrators. Lists groups, allows
 * deleting and navigating to the registration of new groups.
 *
 * Execution flow.
 *
 * - On mount, loads the list of groups using `fetchGroups` and displays them in
 *   a list.
 * - Shows a spinner while data is loading or the auth context is in a loading state.
 * - If the user is not authenticated or not an admin, redirects to login.
 * - Allows deleting groups and, in case of failure, attempts to reload the list.
 *
 * @param {void}
 * @returns {JSX.Element} Groups management component.
 *
 * @example
 * ```tsx
 * <Route path="/admin/dashboard"/groups-management" component={GroupsManagement} />
 * ```
 */

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton, IonSearchbar, useIonRouter } from '@ionic/react';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { fetchGroups, deleteGroup } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import GroupItem from './components/GroupItem';
import './GroupsManagement.css';



export default function GroupsManagement() {

    const { user, loadingAuth: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ id: string; name: string; }[]>([]);
    const [groupQuery, setGroupQuery] = useState<string>('');

    const router = useIonRouter();


    useEffect(() => {
        const loadData = async () => {
            setLoading(true);

            try {
                const groups = await fetchGroups();
                console.log("Grupos recibidos:", groups);
                setGroups(groups);

            } catch (error) {
                console.error("Error cargando grupos:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const displayedGroups = (() => {
        const filtered = groupQuery === '' ? groups : groups.filter(g => {
            const q = groupQuery.toLowerCase();
            const name = (g.name || '').toLowerCase();
            return name.includes(q);
        });
        return filtered;
    })();

    /* 
    !! DEPRECATED
        -> The route managers already do this shit
    // Redirects if not authenticated 
    if (!user || user.role !== 'admin') {
        return <Redirect to="/login" />;
    }
    */

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName={user?.username || "username"} />
            <IonContent scrollY={!(authLoading || loading)}>
                {(authLoading || loading) ? (
                    <div className='group-management-spinner'>
                        <IonSpinner name='crescent' />
                    </div>
                ) : (
                    <div className="groupManagement-MainContainer">
                        <div className="groupManagement-TextAddButton">
                            <IonLabel className="groupManagement-Text">
                                <h2>{'Grupos'}</h2>
                            </IonLabel>
                            <IonSearchbar
                                placeholder="Buscar grupo"
                                value={groupQuery}
                                onIonInput={(e) => setGroupQuery(e.detail.value ?? '')}
                                onIonClear={() => setGroupQuery('')}
                                onIonCancel={() => setGroupQuery('')}
                                className='groupManagement-Searchbar'
                            />
                            <IonButton
                                className="groupManagement-AddButoon"
                                onClick={() =>

                                    router.push('/admin/group/register')

                                }
                            >
                                Añadir nuevo grupo
                            </IonButton>
                        </div>
                        <div className="groupManagement-Table">
                            <IonList>
                                {displayedGroups.map((group) => (
                                    <GroupItem
                                        key={group.id}
                                        id={group.id}
                                        groupName={group.name}
                                        onDelete={async (id) => {
                                            try {
                                                setGroups(prev => prev.filter(g => String(g.id) !== String(id)));
                                                await deleteGroup(Number(id));
                                            } catch (err) {
                                                console.error('Error eliminando grupo:', err);
                                                try {
                                                    const refreshed = await fetchGroups();
                                                    setGroups(refreshed);
                                                } catch (err2) {
                                                    console.error('Error recargando grupos tras fallo:', err2);
                                                }
                                            }
                                        }}
                                    />
                                ))}
                            </IonList>
                        </div>
                    </div>
                )}
            </IonContent>
        </IonPage>
    );
}
