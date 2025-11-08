import { setupIonicReact } from '@ionic/react';
setupIonicReact();

import { IonPage, IonContent, IonSpinner, IonList, IonLabel, IonButton } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useEffect, useState } from 'react';
import { fetchGroups } from '../../lib/api';
import SimpleHeaderAdmin from './components/SimpleHeaderAdmin';
import GroupItem from './components/GroupItem';
import './GroupsManagement.css';

import { useHistory } from 'react-router-dom';


export default function GroupsManagement() {

    const { user, loading: authLoading } = useAuth();

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
                                    groupName={group.name}
                                />
                            ))}
                        </IonList>
                    </div>
                </div>
            </IonContent>
        </IonPage>
    );
}
