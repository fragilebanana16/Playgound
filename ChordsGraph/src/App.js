import logo from './logo.svg';
import './App.css';
import Chord from './ChordParser/Chord'
import guitar from './ChordParser/ChordsDB/lib/guitar.json'
import ukulele from './ChordParser/ChordsDB/lib/ukulele.json'
import { useState } from 'react';
import * as React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ButtonGroup from '@mui/material/ButtonGroup';
import { styled } from '@mui/material/styles';
import FormControlLabel from '@mui/material/FormControlLabel';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import { TextField, Stack } from '@mui/material';
import Pagination from '@mui/material/Pagination';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
// https://github.com/tombatossals/react-chords
const InstrumentSwitch = styled(Switch)(({ theme }) => ({
  width: 62,
  height: 34,
  padding: 7,
  '& .MuiSwitch-switchBase': {
    margin: 1,
    padding: 0,
    transform: 'translateX(6px)',
    '&.Mui-checked': {
      color: '#fff',
      transform: 'translateX(22px)',
      '& .MuiSwitch-thumb:before': {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
          '#fff',
        )}" d="M19.737 1.851 18.149 0.263a0.374 0.374 0 0 0 -0.529 0l-1.588 1.588a0.374 0.374 0 0 0 0 0.529l-4.398 4.398c-1.447 -1.015 -3.056 -1.211 -3.895 -0.373 -0.19 0.19 -0.327 0.42 -0.413 0.678 -0.073 0.214 -0.157 0.434 -0.261 0.654 -0.121 0.257 -0.281 0.501 -0.494 0.714 -0.298 0.298 -0.659 0.491 -1.034 0.612 -0.781 0.251 -1.741 0.434 -2.544 0.676a3.882 3.882 0 0 0 -0.852 0.32c-0.13 0.064 -0.247 0.132 -0.35 0.206l0 0a3.581 3.581 0 0 0 -0.538 0.442C0.511 11.45 0.153 12.458 0.154 13.538c0.002 1.471 0.67 3.077 1.95 4.357C3.388 19.18 4.987 19.849 6.462 19.846c1.074 -0.002 2.092 -0.361 2.829 -1.098a3.577 3.577 0 0 0 0.444 -0.541c0.072 -0.099 0.138 -0.213 0.2 -0.338a3.878 3.878 0 0 0 0.331 -0.881c0.24 -0.8 0.422 -1.75 0.67 -2.525 0.121 -0.375 0.314 -0.736 0.612 -1.034 0.213 -0.213 0.457 -0.373 0.714 -0.494 0.216 -0.102 0.432 -0.185 0.644 -0.257 0.263 -0.086 0.496 -0.224 0.689 -0.416 0.839 -0.839 0.642 -2.448 -0.373 -3.895l4.398 -4.398 0 0c0.146 0.146 0.383 0.146 0.529 0l1.588 -1.588a0.374 0.374 0 0 0 0 -0.529zM6.508 16.147 3.862 13.5l0.529 -0.529 2.647 2.647 -0.529 0.529zm3.924 -4.594c-0.548 0.548 -1.437 0.548 -1.985 0s-0.548 -1.437 0 -1.985c0.548 -0.548 1.437 -0.548 1.985 0s0.548 1.437 0 1.985z"/></svg>')`,
      },
      '& + .MuiSwitch-track': {
        opacity: 1,
        backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
      },
    },
  },
  '& .MuiSwitch-thumb': {
    backgroundColor: theme.palette.mode === 'dark' ? '#003892' : '#001e3c',
    width: 32,
    height: 32,
    '&:before': {
      content: "''",
      position: 'absolute',
      width: '100%',
      height: '100%',
      left: 0,
      top: 0,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" viewBox="0 0 20 20"><path fill="${encodeURIComponent(
        '#fff',
      )}" d="M19.305 1.228 18.8 0.723c-0.926 -0.924 -2.432 -0.923 -3.356 0.001l-1.148 1.148c-0.255 0.256 -0.399 0.609 -0.395 0.969 0.003 0.217 0.058 0.424 0.161 0.607l-3.673 3.673c-2.417 -1.246 -6.763 0.672 -8.617 2.527C0.629 10.789 0 12.308 0 13.924s0.629 3.135 1.772 4.277c1.179 1.179 2.728 1.768 4.277 1.768 1.548 0 3.098 -0.589 4.277 -1.768 1.835 -1.836 3.73 -6.108 2.56 -8.54l3.697 -3.698c0.488 0.272 1.152 0.189 1.561 -0.219l1.161 -1.161C19.753 4.135 20 3.54 20 2.906c0 -0.633 -0.247 -1.229 -0.695 -1.678zM5 14.14a0.831 0.831 0 0 1 -0.589 -0.244c-0.326 -0.326 -0.326 -0.853 0 -1.178l1.667 -1.667c0.326 -0.326 0.853 -0.326 1.178 0 0.326 0.325 0.326 0.853 0 1.178l-1.667 1.667A0.831 0.831 0 0 1 5 14.14zm3.922 -0.244 -1.667 1.667a0.831 0.831 0 0 1 -0.589 0.244 0.831 0.831 0 0 1 -0.589 -0.244c-0.326 -0.326 -0.326 -0.853 0 -1.178l1.667 -1.667c0.326 -0.326 0.853 -0.326 1.178 0 0.326 0.325 0.326 0.853 0 1.178zM18.127 3.405l-0.943 0.943c-0.495 -0.275 -1.137 -0.204 -1.559 0.218l-3.848 3.848 -1.518 1.518c-0.053 -0.055 -0.107 -0.11 -0.162 -0.163l5.365 -5.365c0.248 -0.248 0.388 -0.592 0.383 -0.943 -0.003 -0.22 -0.061 -0.432 -0.165 -0.617l0.943 -0.943c0.274 -0.276 0.723 -0.276 0.999 0l0.505 0.506c0.133 0.133 0.207 0.31 0.207 0.498a0.702 0.702 0 0 1 -0.207 0.499z"/></svg>')`,
    },
  },
  '& .MuiSwitch-track': {
    opacity: 1,
    backgroundColor: theme.palette.mode === 'dark' ? '#8796A5' : '#aab4be',
    borderRadius: 20 / 2,
  },
}));

const instruments = { guitar, ukulele }
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));

const LeftMenu = ({ instrument, selectedKey, suffixes, selectedSuffix }) =>
  selectedKey && (
    <ul className="pl-3">
      {suffixes.map(suffix => (
        <li key={suffix} className="mr-3 block">
          {selectedKey.replace("sharp", "#")}
          <span className="text-sm">{suffix}</span>
        </li>
      ))}
    </ul>
  )

const Menu = ({ instrument, keys, selectedKey }) => (
  <ul className="pl-3 flex flex-wrap">
    <li className="font-bold p-1">Keys:</li>
    {keys.map(key => (
      <li key={key} className="mr-3">
        {key}
      </li>
    ))}
  </ul>
)

function paginate(array, page_size, page_number) {
  return array.slice((page_number - 1) * page_size, page_number * page_size);
}

const chordPerPage = 8;
const chordPerRow = 4;
const ChordsPage = ({ chords, instrument, lite, svg, page }) => (
  <>
    {0 === chords.length ? <Typography sx={{width:"100%"}}>Oops</Typography> :
      <Grid container spacing={2}>
        {chords &&
          paginate(Array.from(chords), chordPerPage, page).map((chord, px) => {
            return chord.positions.map((position, version) =>
            (
              <Grid item xs={12 / chordPerRow} key={version}>
                <Item>
                  <Box key={version} display="flex"
                    flexDirection="column"
                    alignItems="center">
                    <span>{chord.key}{chord.suffix}{chord.positions.length > 1 && (
                      <span>(v{version + 1})</span>
                    )}</span>{" "}
                    <Chord chord={position} instrument={instrument} lite={lite} key={version} />
                  </Box>
                </Item>
              </Grid>
            )
            )
          })
        }
      </Grid>
    }
  </>
)

const MyChord = () => {
  const lite = false // defaults to false if omitted
  const [selectedInstrument, setSelectedInstrument] = useState("guitar");
  const [suffixTabValue, setSuffixTabValue] = useState(0);
  const [isAll, setIsAll] = useState(true);
  const [keyTabValue, setKeyTabValue] = useState(0);
  const [page, setPage] = useState(1); // start from 1
  const [query, setQuery] = useState("");
  const [guitarChecked, setGuitarChecked] = useState(true);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const get_suffixes = chords => chords.map(chord => chord.suffix)
  const only_main_position = chord => Object.assign({}, chord, { positions: [chord.positions[0]] })
  const get_chords = (chords, key, suffix) => {
    const selection = []
    if (!key && !suffix) {
      Object.keys(chords).map(k =>
        chords[k].map(chord => selection.push(only_main_position(chord)))
      )
    } else if (!suffix) {
      chords[key].map(chord => selection.push(only_main_position(chord)))
    } else if (!key) {
      Object.keys(chords).map(k =>
        chords[k]
          .filter(c => c.suffix === suffix)
          .map(chord => selection.push(only_main_position(chord)))
      )
    } else {
      return chords[key].filter(c => c.suffix === suffix)
    }

    return selection
  }

  let renderKeys = instruments[selectedInstrument].keys;
  let renderSuffix = get_suffixes(instruments[selectedInstrument].chords[renderKeys[keyTabValue].replace("#", "sharp")]);
  const chords = get_chords(instruments[selectedInstrument].chords, isAll ? "" : renderKeys[keyTabValue].replace("#", "sharp"), isAll ? "" :renderSuffix[suffixTabValue])
  const keyChords = get_chords(instruments[selectedInstrument].chords, renderKeys[keyTabValue].replace("#", "sharp"),"")
  const filteredchords = chords.filter((chord) => (chord.key + chord.suffix).toLowerCase().includes(query));
  const instrument = Object.assign(instruments[selectedInstrument].main, {
    tunings: instruments[selectedInstrument].tunings,
  })

  const chordsCount =!isAll ? filteredchords.map(e => e.positions.length).reduce((accumulator, currentValue) => { return accumulator + currentValue}, 0) : filteredchords.length
  function CustomTabPanel(props) {
    const { children, value, index, ...other } = props;
    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`simple-tabpanel-${index}`}
        aria-labelledby={`simple-tab-${index}`}
        {...other}
      >
        {/* get rid of this, just want tab, not the content, but warning children etc  */}
        {/* {value === index && (
          <Box sx={{ p: 3 }}>
            <Typography>{children}</Typography>
          </Box>
        )} */}
      </div>
    );
  }

  const handleChangeKey = (event, newValue) => {
    if(0 === newValue){
      setIsAll(true);
    }
    else{
      setIsAll(false);
      setKeyTabValue(newValue-1);
      setSuffixTabValue(0);
      setPage(1);
    }
  };

  const handleChangeSuffix = (event, newValue) => {
    setSuffixTabValue(newValue);
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Grid container spacing={0.6} >
        <Grid item xs={1}>
          <Item>
          <Typography display="flex" alignItems="center" height={49} justifyContent="center">Suffixes\Keys</Typography>
          </Item>
        </Grid>

        {/* keys */}
        <Grid item xs={11}>
          <Item>
            <Box sx={{ width: '100%' }}>
            <Stack direction="row" justifyContent="space-between">

              <Box sx={{ borderBottom: 1, borderColor: "transparent" }}>
                <Tabs
                  onChange={handleChangeKey}
                  value={isAll ? 0 : keyTabValue + 1}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="scrollable auto tabs example"
                  TabIndicatorProps={{
                    style: {
                      display: 'none' // hide underline
                    }
                  }}
                >
                  {["All"].concat(renderKeys).map((k, index) => <Tab label={k} key={index} />)}
                </Tabs>
              </Box>

              {/* provide this corresponding panel */}
              {["All"].concat(renderKeys).map((k, index) => <CustomTabPanel value={keyTabValue} index={index} key={index}>123</CustomTabPanel>)}

              {/* search */}
              <Stack direction="row" justifyContent="space-between" spacing={3}>
              <Divider orientation="vertical"/>
                <FormControlLabel
                  control={<InstrumentSwitch sx={{ m: 1 }} checked={guitarChecked} />} onChange={(event) => { setGuitarChecked(event.target.checked); setSelectedInstrument(event.target.checked ? "guitar" : "ukulele") }}
                  label={guitarChecked ? "Guitar" : "Ukulele"}
                />
                <Box display="flex" alignItems="center" height={49} justifyContent="flex-end">
                  <TextField size="small" placeholder='Search...' onChange={(e) => { setQuery(e.target.value.toLowerCase()); setPage(1); }} />
                </Box>
              </Stack>
              </Stack>

            </Box>
          </Item>
        </Grid>

    

        {/* suffix */}
        <Grid item xs={1}>
          <Item>
            <Box sx={{ width: '100%' }}>
              <Box
                sx={{ flexGrow: 1, display: 'flex', height: "90vh" }}
              >
              {isAll ? <Typography></Typography> :
                <Tabs
                  value={suffixTabValue}
                  onChange={handleChangeSuffix}
                  variant="scrollable"
                  scrollButtons="auto"
                  aria-label="scrollable auto tabs example"
                  orientation="vertical"
                  TabIndicatorProps={{
                    style: {
                      display: 'none' // hide underline
                    }
                  }}
                >
                  {renderSuffix.map((suffix, index) => (
                    <Tab label={renderKeys[keyTabValue].replace("sharp", "#") + suffix} key={index} />
                  ))}
                </Tabs>
              }
              </Box>
              {renderSuffix.map((k, index) => <CustomTabPanel value={suffixTabValue} index={index} key={index}>123</CustomTabPanel>)}
            </Box>
          </Item>
        </Grid>

        {/* chords */}
        <Grid item xs={11}>
          <Item>
            <Stack height="90vh" direction="column" alignItems="center" justifyContent="space-between">
              <ChordsPage chords={filteredchords} instrument={instrument} lite={lite} svg={false} page={page} />
              {console.log(chordsCount / chordPerPage)}
              {(chordsCount / chordPerPage) > 1 ? <Pagination count={Math.ceil(chordsCount / chordPerPage)} showFirstButton showLastButton onChange={handleChangePage} page={page ?? 1} /> : null}
              
            </Stack>
          </Item>
        </Grid>
      </Grid>
    </Box>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">

        <MyChord></MyChord>
      </header>
    </div>
  );
}

export default App;
