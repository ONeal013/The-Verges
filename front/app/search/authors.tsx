import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import KTextInput from '../../src/components/TextInput';
import KButton from '../../src/components/Button';
import Physics from '../../src/constants/physics';
import React from 'react';
import { useSearch } from '../../src/hooks/search/author';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Strings from '../../src/constants/strings';
import { ActivityIndicator } from 'react-native';
import Colors from '../../src/constants/colors';
import KAuthorBookView from '../../src/views/AuthorBooks';
import { useLocalSearchParams } from 'expo-router';
import KPaginator from '../../src/components/paginator';
import KIconButton from '../../src/components/IconButton';
import { Ionicons } from '@expo/vector-icons';
import { Author } from '../../src/models/author';
import KAuthorSuggestion from '../../src/components/AuthorSug';


export default function Search() {
    // get expo url params 
    const params = useLocalSearchParams<{ q?: string }>();
    NavigationBar.setBackgroundColorAsync('#1d2437');

    // hooks
    const [term, setTerm] = React.useState<string>(params.q ?? '');
    const [isLoadingComplete, results, searchedTerm, searchStr] = useSearch();

    const searchAuthor = (author: Author) => {
        setTerm(author.name);
        return searchStr(author.name);
    }

    const correctedText: Array<React.JSX.Element> = [];
    const typos = Object.entries(results?.typos ?? {});
    if (typos.length > 0) {
        let _term = (searchedTerm ?? '').toLocaleLowerCase();
        typos.forEach(([subTerm, token]) => {
            const index = _term.indexOf(subTerm)
            const length = subTerm.length;
            correctedText.push(<Text key={index}>{_term.slice(0, index)}</Text>);
            correctedText.push(<Text key={index + 1} style={{ fontWeight: 'bold' }}>{token}</Text>);
            _term = _term.slice(index + length);
        });
    } else {
        console.log('No typos found');
        correctedText.push(<Text key={0}>{searchedTerm}</Text>);
    }

    return (
        <SafeAreaProvider>
            <View style={styles.container}>
                <StatusBar style="dark" />
                <View style={styles.searchContainer}>
                    <SafeAreaView style={styles.searchZone}>
                        <KTextInput value={term} onChangeText={setTerm} onSubmitEditing={() => searchStr(term)} />
                        <KButton title={Strings.search} onPress={() => searchStr(term)} />
                    </SafeAreaView>
                    <SafeAreaView style={{ flexDirection: 'row', gap: 10 }}>
                        <KIconButton link={`/search?q=${term}`}>
                            <Ionicons name="book-outline" size={Physics.icon.medium} color={Colors.light.primaryDark} />
                        </KIconButton>
                        <KIconButton selected link={`/search/authors?q=${term}`}>
                            <Ionicons name="person-outline" size={Physics.icon.medium} color={'white'} />
                        </KIconButton>
                        <KIconButton link={`/search/advanced?q=${term}`}>
                            <Ionicons name="code-slash" size={Physics.icon.medium} color={Colors.light.primaryDark} />
                        </KIconButton>
                    </SafeAreaView>
                </View>
                {isLoadingComplete === false &&
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator style={{ flex: 1 }} size="large" color={Colors.light.secondaryDark} />
                    </View>
                }
                {results?.error && <View style={{ width: '100%', backgroundColor: 'red', alignItems: 'center', justifyContent: 'center' }}>
                    <Text>{results.error}</Text>
                </View>}
                {isLoadingComplete && results && !results?.error && <View style={styles.resultZone}>
                    <ScrollView>
                        {
                            results.tokens &&
                            <View style={styles.resultInfo}>
                                <View style={styles.resultTokens}>
                                    {results.info && <Text style={{ fontWeight: 'bold' }}>{results.info!.length}</Text>}
                                    <Text>results in</Text>
                                    {results.info && <Text style={{ fontWeight: 'bold' }}>{results.info!.time} second(s)</Text>}
                                    <Text>for :</Text>
                                    {correctedText}
                                </View>
                                <View style={styles.resultTokens}>
                                    <Text>Page:</Text>
                                    {results.info && <Text style={{ fontWeight: 'bold' }}>{results.info!.page}</Text>}
                                    <Text>of</Text>
                                    {results.info && <Text style={{ fontWeight: 'bold' }}>{Math.ceil(results.info!.length / results.info!.limit)}</Text>}
                                </View>
                            </View>
                        }
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', ...styles.resultList }}>
                            {
                                (results.message !== undefined)
                                    ? <View style={styles.resultMessage}>
                                        <Text>{results.message}</Text>
                                    </View>
                                    : (results.data ?? []).map((author, i) => (
                                        <View key={i} style={styles.resultItem}>
                                            <KAuthorSuggestion author={author} onPress={() => searchAuthor(author)} />
                                        </View>
                                    ))
                            }
                            {/* {results.data && results.data[0] && <KBookSuggestionView book={results.data[0]} onSuggestionSelect={searchAuthor} />} */}
                        </View>

                        {results?.data && results.data[0] && <View style={styles.sugContainer}>
                            <KAuthorBookView author={results.data[0]} />
                        </View>}
                        {results.info && <View style={{ width: '100%', alignItems: 'center' }}>
                            <KPaginator
                                current={results.info.page}
                                total={results.info.length}
                                limit={results.info.limit}
                                neighbours={3}
                                onPageChange={(page) => searchStr(term, page)}
                            />
                        </View>}
                    </ScrollView>
                </View>}
            </View>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        backgroundColor: Colors.light.background ?? '#fff',
    },
    sugContainer: {
        // flex: 1,
        // padding: Physics.padding.small,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    searchZone: {
        flex: 1,
        padding: Physics.padding.large,
        gap: Physics.gap.medium,
        flexDirection: 'row',
        maxWidth: 700,
        width: '100%',
    },
    resultZone: {
        flex: 1,
        maxWidth: '100%',
    },
    resultInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Physics.gap.medium,
    },
    resultList: {
        flexGrow: 1,
        gap: Physics.gap.large,
        paddingHorizontal: Physics.padding.medium,
        borderRadius: Physics.borderRadius.medium,
    },
    resultItem: {
        paddingBottom: Physics.padding.medium,
    },
    resultTokens: {
        paddingVertical: Physics.padding.small,
        paddingHorizontal: Physics.padding.large,
        borderRadius: Physics.borderRadius.medium,
        backgroundColor: Colors.light.canvas,
        flexDirection: 'row',
        gap: Physics.gap.small,
    },
    resultMessage: {
        padding: Physics.padding.small,
        borderRadius: Physics.borderRadius.medium,
        backgroundColor: Colors.light.canvas,
    },
});
