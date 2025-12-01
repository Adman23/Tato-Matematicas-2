/**
 * Functional Summary.
 *
 * Reusable simple header for edit views. Displays the
 * student's name, what is being edit and a button to go to the dashboard.
 *
 * Execution flow.
 *
 * - Renders the title with the student's name passed via props.
 * - `handleHome` navigates to the teacher dashboard.
 *
 * @param {Props} props - Component props (see `Props` interface).
 * @returns {JSX.Element} Header for admin views.
 *
 * @example Example usage
 *
 * ```tsx
 * <SimpleHeaderEdit StudentName="Student" Editing="Edit" />
 * ```
 */

import {
    IonToolbar,
    IonButton,
    IonHeader,
    IonButtons,
    IonIcon,
    useIonRouter
} from '@ionic/react';

import './SimpleHeaderEdit.css';
import { homeOutline } from 'ionicons/icons';
import { setupIonicReact } from '@ionic/react';

setupIonicReact();

/**
 * Props of SimpleHeaderEdit
 *
 * @property studentName - Name to display in the header
 * @property Editing - What is being edit
 */
interface Props {
    studentName: String;
    Editing: String;
}

/**
 * Simple header component for the student editing section.
 * - `handleHome` redirects to the admin dashboard.
 */
const SimpleHeaderEdit: React.FC<Props> = ({
    studentName,
    Editing
}) => {

    const router = useIonRouter();

    /**
     * Functional Summary.
     *
     * Navigates to the teacher dashboard.
     *
     * @param {void}
     * @returns {void}
     *
     * @example
     * ```ts
     * handleHome();
     * ```
     */
    const handleHome = () => {
        router.push('/teacher/profile',"back","pop");
    }

    return (
        <IonHeader className='header-editStudentProfile'>
            <IonToolbar className="toolbar-header-editStudentProfile">

                <IonButtons slot='start'>
                    <IonButton className='homeButton-header-editStudentProfile' onClick={handleHome} >
                        <IonIcon slot="icon-only" md={homeOutline}></IonIcon>
                    </IonButton>
                </IonButtons>

                <div className='container-info-editStudentProfile'>
                    <div className='title-header-editStudentProfile'>{studentName}</div>
                    <div className='label-header-editStudentProfile'>{Editing}</div>
                </div>

                <IonButtons slot="end">
                    <div className="spacer-end"></div>
                </IonButtons>
                
            </IonToolbar>
        </IonHeader>
    );
}

export default SimpleHeaderEdit;