import { SafeAreaView, StyleSheet, Text, View, TextInput, Modal, FlatList, Pressable, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import DropDownPicker from 'react-native-dropdown-picker';
import { AntDesign } from '@expo/vector-icons';
import { categories } from './data/categories.json';
import { clients } from './data/clients.json';

console.log(categories);

export default function App() {
	const [allNotes, setAllNotes] = useState([]);
	const [note, setNote] = useState('');
	const [modalVisible, setModalVisible] = useState(false);
	const [catDropDownOpen, setCatDropDownOpen] = useState(false);
	const [clientDropDownOpen, setClientDropDownOpen] = useState(false);
	const [catDropDownValue, setCatDropDownValue] = useState(null);
	const [clientDropDownValue, setClientDropDownValue] = useState(null);
	const [category, setCategory] = useState(categories);
	const [client, setClient] = useState(clients);
	const [noteIdToEdit, setNoteIdToEdit] = useState();

	useEffect(() => {
		//load all notes from device storage initially
		handleGetNotes();
	}, []);

	const getNotes = async () => {
		try {
			const storageData = await AsyncStorage.getItem('NOTES');
			return storageData !== null ? JSON.parse(storageData) : [];
		} catch (e) {
			console.log('Error getting Notes', e);
		}
	};

	const saveNote = async () => {
		const n = await getNotes();
		if (note !== '' && catDropDownValue !== null && clientDropDownValue !== null) {
			if (noteIdToEdit) {
				const updatedNote = {
					text: note,
					category: catDropDownValue,
					client: clientDropDownValue,
				};
				const updatedAllNotes = allNotes.map((noteItem) => (noteItem.id === noteIdToEdit ? { ...noteItem, ...updatedNote } : noteItem));
				const jsonValue = JSON.stringify(updatedAllNotes);
				await AsyncStorage.setItem('NOTES', jsonValue);
				setNoteIdToEdit(null);
				handleGetNotes();
				setModalVisible(false);
			} else {
				const newNote = createNote(note);
				n.push(newNote);
				try {
					const jsonValue = JSON.stringify(n);
					await AsyncStorage.setItem('NOTES', jsonValue);
					setNote('');
					setModalVisible(false);
					handleGetNotes();
					setCatDropDownValue(null);
					setClientDropDownValue(null);
				} catch (e) {
					console.log('Error saving notes', e);
				}
			}
		} else Alert.alert('Please enter required fields');
	};

	const editNote = async (item) => {
		setNoteIdToEdit(item.id);
		setNote(item.text);
		setCatDropDownValue(item.category);
		setClientDropDownValue(item.client);
		setModalVisible(true);
	};

	const handleAddNewNote = () => {
		saveNote();
		setNote('');
	};

	const handleGetNotes = async () => {
		const data = await getNotes();
		setAllNotes(data);
	};

	const handleOpenForm = () => {
		setModalVisible(true);
	};

	const handleCloseForm = () => {
		setModalVisible(false);
		setNote('');
		setCatDropDownValue(null);
		setClientDropDownValue(null);
		setNoteIdToEdit(null);
	};

	const createNote = (text) => {
		return {
			id: Math.floor(Math.random() * 1000), //randomizing ids
			text,
			category: catDropDownValue,
			client: clientDropDownValue,
		};
	};

	const deleteNote = async (id) => {
		const newNotes = await allNotes.filter((note) => note.id !== id);
		await AsyncStorage.setItem('NOTES', JSON.stringify(newNotes));
		handleGetNotes();
	};

	const deleteAllNotes = async () => {
		try {
			Alert.alert('Delete', 'Are you sure you want to delete all notes', [
				{
					text: 'No',
					onPress: () => console.log('Cancel Pressed'),
					style: 'cancel',
				},
				{
					text: 'Yes',
					onPress: async () => {
						await AsyncStorage.clear();
						handleGetNotes();
					},
				},
			]);
		} catch (e) {
			console.log('Error deleting all notes', e);
		}
	};

	const renderNote = (item) => {
		const { id, text, category, client } = item;
		return (
			<View style={styles.noteContainer}>
				<Pressable onPress={() => editNote(item)} style={{ flex: 1 }}>
					<Text style={{ fontWeight: 800 }}>{client}</Text>
					<Text style={{ fontWeight: 200 }}>{category}</Text>
					<Text style={{ color: 'gray', fontSize: 22 }}>{text}</Text>
				</Pressable>
				<Pressable onPress={() => deleteNote(id)}>
					<AntDesign name='delete' size={20} color='red' />
				</Pressable>
			</View>
		);
	};

	return (
		<SafeAreaView style={styles.container}>
			<Text style={{ alignSelf: 'center' }}>Note App</Text>
			<Modal animationType='slide' transparent={false} visible={modalVisible}>
				<SafeAreaView style={styles.modalContainer}>
					<DropDownPicker
						open={clientDropDownOpen}
						value={clientDropDownValue}
						items={client}
						setOpen={setClientDropDownOpen}
						setValue={setClientDropDownValue}
						setItems={setClient}
						placeholder='Select a Client'
						style={{ borderColor: 'lightgray' }}
						containerStyle={{ width: '50%', borderColor: 'lightgray' }}
					/>
					<TextInput
						value={note}
						placeholder='Enter Note ...'
						style={styles.textInput}
						multiline={true}
						numberOfLines={5}
						onChangeText={(text) => setNote(text)}
					/>
					<DropDownPicker
						open={catDropDownOpen}
						value={catDropDownValue}
						items={category}
						setOpen={setCatDropDownOpen}
						setValue={setCatDropDownValue}
						setItems={setCategory}
						placeholder='Select a Category'
						style={{ borderColor: 'lightgray' }}
						containerStyle={{ width: '50%', borderColor: 'lightgray' }}
					/>

					<View style={styles.btnContainer}>
						<Pressable onPress={handleCloseForm} style={styles.btnClose}>
							<Text style={{ color: 'white' }}>Close</Text>
						</Pressable>
						<Pressable onPress={handleAddNewNote} style={styles.btnSave}>
							<Text style={{ color: 'white' }}>Save</Text>
						</Pressable>
					</View>
				</SafeAreaView>
			</Modal>

			{/* display all notes */}
			{allNotes.length > 0 ? (
				<FlatList keyExtractor={(item) => item.id} data={allNotes} renderItem={({ item }) => renderNote(item)} style={{ padding: 5 }} />
			) : (
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<Text style={{ fontSize: 24 }}>No notes</Text>
				</View>
			)}
			<Pressable onPress={handleOpenForm} style={styles.addButtonStyle}>
				<Text style={{ color: 'blue', fontSize: 28 }}>Add New Note</Text>
			</Pressable>
			<Pressable onPress={deleteAllNotes} style={styles.clearButtonStyle}>
				<Text style={{ color: 'red' }}>Clear Data</Text>
			</Pressable>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
	},
	textInput: {
		borderWidth: 1,
		borderRadius: 4,
		borderColor: 'lightgray',
		margin: 5,
		padding: 5,
		width: '80%',
		minHeight: 100,
	},
	addButtonStyle: {
		justifyContent: 'center',
		alignItems: 'center',
		margin: 5,
	},
	clearButtonStyle: {
		justifyContent: 'center',
		alignItems: 'center',
		margin: 5,
	},
	btnContainer: {
		flexDirection: 'row',
		justifyContent: 'space-evenly',
		alignSelf: 'flex-end',
		width: '100%',
	},
	modalContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		margin: 10,
	},
	noteContainer: {
		display: 'flex',
		flexDirection: 'row',
		padding: 5,
		margin: 5,
		justifyContent: 'space-between',
		alignItems: 'center',
		borderWidth: 1,
		borderRadius: 5,
		borderColor: 'lightgray',
	},
	btnSave: { backgroundColor: 'black', margin: 5, padding: 5, borderWidth: 1, borderColor: 'lightgray', borderRadius: 10 },
	btnClose: { backgroundColor: 'black', margin: 5, padding: 5, borderWidth: 1, borderColor: 'lightgray', borderRadius: 10 },
});
