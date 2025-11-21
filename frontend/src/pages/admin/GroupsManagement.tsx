import { setupIonicReact } from '@ionic/react';
setupIonicReact();

/**
 * Resumen Funcional.
 *
 * Página de gestión de grupos para administradores. Lista grupos, permite
 * eliminar y navegar al registro de nuevos grupos.
 *
 * Flujo de ejecución.
 *
 * - Al montar, carga la lista de grupos mediante `fetchGroups` y la muestra en
 *   una lista.
 * - Muestra un spinner mientras se cargan los datos o el contexto de auth está
 *   en estado de carga.
 * - Si el usuario no está autenticado o no es admin, redirige al login.
 * - Permite eliminar grupos y, en caso de fallo, intenta recargar la lista.
 *
 * @param {void}
 * @returns {JSX.Element} Componente de gestión de grupos.
 *
 * @example
 * ```tsx
 * <Route path="/admin-dashboard/groups-management" component={GroupsManagement} />
 * ```
 */

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { fetchGroups, deleteGroup } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import GroupItem from './components/GroupItem';
import './GroupsManagement.css';

import { useHistory } from 'react-router-dom';


export default function GroupsManagement() {

    const { user, loadingAuth: authLoading } = useAuth();

    const [loading, setLoading] = useState(true);
    const [groups, setGroups] = useState<{ id: string; name: string; }[]>([]);

    const history = useHistory();


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

    if (authLoading || loading) {
        return (
            <IonPage>
                <IonContent className="ion-text-center">
                    <div className='group-management-spinner'>
                        <IonSpinner name='crescent' />
                    </div>
                </IonContent>
            </IonPage>
        );
    }

    // Redirige si no está autenticado 
    if (!user || user.role !== 'admin') {
        return <Redirect to="/login" />;
    }

    return (
        <IonPage>
            <SimpleHeaderAdmin adminName={user.username} />
            <IonContent>
                <div className="groupManagement-MainContainer">
                    <div className="groupManagement-TextAddButton">
                        <IonLabel className="groupManagement-Text">
                            <h2>{'Grupos'}</h2>
                        </IonLabel>
                        <IonButton
                            className="groupManagement-AddButoon"
                            onClick={() =>

                                history.push('/group-register')

                            }
                        >
                            Añadir nuevo grupo
                        </IonButton>
                    </div>
                    <div className="groupManagement-Table">
                        <IonList>
                            {groups.map((group) => (
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
            </IonContent>
        </IonPage>
    );
}
