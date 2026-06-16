import { BracketCandidateMap } from "@/types/bracketCandidateMap.type";
import { BracketPredictionProjection } from "@/types/bracketPredictionProjection.interface";
import { GroupMatchProjection } from "@/types/groupMatchProjection.interface";
import { ScorePredictionProjection } from "@/types/scorePredictionProjection.interface";

const PHASE_ORDER = [
  '16th-finals',
  '8th-finals',
  'quarter-finals',
  'semi-finals',
  'finals',
];

const THIRD_PLACE_WINNER_GROUP_ORDER = ['A', 'B', 'D', 'E', 'G', 'I', 'K', 'L'] as const;

// Official FIFA 2026 Annex C mapping for the 495 possible combinations of
// best third-placed teams. Each row is:
//   qualified third-place groups : assignments for 1A,1B,1D,1E,1G,1I,1K,1L
const FIFA_THIRD_PLACE_ASSIGNMENT_ROWS = [
  'EFGHIJKL:EJIFHGLK',
  'DFGHIJKL:HGIDJFLK',
  'DEGHIJKL:EJIDHGLK',
  'DEFHIJKL:EJIDHFLK',
  'DEFGIJKL:EGIDJFLK',
  'DEFGHJKL:EGJDHFLK',
  'DEFGHIKL:EGIDHFLK',
  'DEFGHIJL:EGJDHFLI',
  'DEFGHIJK:EGJDHFIK',
  'CFGHIJKL:HGICJFLK',
  'CEGHIJKL:EJICHGLK',
  'CEFHIJKL:EJICHFLK',
  'CEFGIJKL:EGICJFLK',
  'CEFGHJKL:EGJCHFLK',
  'CEFGHIKL:EGICHFLK',
  'CEFGHIJL:EGJCHFLI',
  'CEFGHIJK:EGJCHFIK',
  'CDGHIJKL:HGICJDLK',
  'CDFHIJKL:CJIDHFLK',
  'CDFGIJKL:CGIDJFLK',
  'CDFGHJKL:CGJDHFLK',
  'CDFGHIKL:CGIDHFLK',
  'CDFGHIJL:CGJDHFLI',
  'CDFGHIJK:CGJDHFIK',
  'CDEHIJKL:EJICHDLK',
  'CDEGIJKL:EGICJDLK',
  'CDEGHJKL:EGJCHDLK',
  'CDEGHIKL:EGICHDLK',
  'CDEGHIJL:EGJCHDLI',
  'CDEGHIJK:EGJCHDIK',
  'CDEFIJKL:CJEDIFLK',
  'CDEFHJKL:CJEDHFLK',
  'CDEFHIKL:CEIDHFLK',
  'CDEFHIJL:CJEDHFLI',
  'CDEFHIJK:CJEDHFIK',
  'CDEFGJKL:CGEDJFLK',
  'CDEFGIKL:CGEDIFLK',
  'CDEFGIJL:CGEDJFLI',
  'CDEFGIJK:CGEDJFIK',
  'CDEFGHKL:CGEDHFLK',
  'CDEFGHJL:CGJDHFLE',
  'CDEFGHJK:CGJDHFEK',
  'CDEFGHIL:CGEDHFLI',
  'CDEFGHIK:CGEDHFIK',
  'CDEFGHIJ:CGJDHFEI',
  'BFGHIJKL:HJBFIGLK',
  'BEGHIJKL:EJIBHGLK',
  'BEFHIJKL:EJBFIHLK',
  'BEFGIJKL:EJBFIGLK',
  'BEFGHJKL:EJBFHGLK',
  'BEFGHIKL:EGBFIHLK',
  'BEFGHIJL:EJBFHGLI',
  'BEFGHIJK:EJBFHGIK',
  'BDGHIJKL:HJBDIGLK',
  'BDFHIJKL:HJBDIFLK',
  'BDFGIJKL:IGBDJFLK',
  'BDFGHJKL:HGBDJFLK',
  'BDFGHIKL:HGBDIFLK',
  'BDFGHIJL:HGBDJFLI',
  'BDFGHIJK:HGBDJFIK',
  'BDEHIJKL:EJBDIHLK',
  'BDEGIJKL:EJBDIGLK',
  'BDEGHJKL:EJBDHGLK',
  'BDEGHIKL:EGBDIHLK',
  'BDEGHIJL:EJBDHGLI',
  'BDEGHIJK:EJBDHGIK',
  'BDEFIJKL:EJBDIFLK',
  'BDEFHJKL:EJBDHFLK',
  'BDEFHIKL:EIBDHFLK',
  'BDEFHIJL:EJBDHFLI',
  'BDEFHIJK:EJBDHFIK',
  'BDEFGJKL:EGBDJFLK',
  'BDEFGIKL:EGBDIFLK',
  'BDEFGIJL:EGBDJFLI',
  'BDEFGIJK:EGBDJFIK',
  'BDEFGHKL:EGBDHFLK',
  'BDEFGHJL:HGBDJFLE',
  'BDEFGHJK:HGBDJFEK',
  'BDEFGHIL:EGBDHFLI',
  'BDEFGHIK:EGBDHFIK',
  'BDEFGHIJ:HGBDJFEI',
  'BCGHIJKL:HJBCIGLK',
  'BCFHIJKL:HJBCIFLK',
  'BCFGIJKL:IGBCJFLK',
  'BCFGHJKL:HGBCJFLK',
  'BCFGHIKL:HGBCIFLK',
  'BCFGHIJL:HGBCJFLI',
  'BCFGHIJK:HGBCJFIK',
  'BCEHIJKL:EJBCIHLK',
  'BCEGIJKL:EJBCIGLK',
  'BCEGHJKL:EJBCHGLK',
  'BCEGHIKL:EGBCIHLK',
  'BCEGHIJL:EJBCHGLI',
  'BCEGHIJK:EJBCHGIK',
  'BCEFIJKL:EJBCIFLK',
  'BCEFHJKL:EJBCHFLK',
  'BCEFHIKL:EIBCHFLK',
  'BCEFHIJL:EJBCHFLI',
  'BCEFHIJK:EJBCHFIK',
  'BCEFGJKL:EGBCJFLK',
  'BCEFGIKL:EGBCIFLK',
  'BCEFGIJL:EGBCJFLI',
  'BCEFGIJK:EGBCJFIK',
  'BCEFGHKL:EGBCHFLK',
  'BCEFGHJL:HGBCJFLE',
  'BCEFGHJK:HGBCJFEK',
  'BCEFGHIL:EGBCHFLI',
  'BCEFGHIK:EGBCHFIK',
  'BCEFGHIJ:HGBCJFEI',
  'BCDHIJKL:HJBCIDLK',
  'BCDGIJKL:IGBCJDLK',
  'BCDGHJKL:HGBCJDLK',
  'BCDGHIKL:HGBCIDLK',
  'BCDGHIJL:HGBCJDLI',
  'BCDGHIJK:HGBCJDIK',
  'BCDFIJKL:CJBDIFLK',
  'BCDFHJKL:CJBDHFLK',
  'BCDFHIKL:CIBDHFLK',
  'BCDFHIJL:CJBDHFLI',
  'BCDFHIJK:CJBDHFIK',
  'BCDFGJKL:CGBDJFLK',
  'BCDFGIKL:CGBDIFLK',
  'BCDFGIJL:CGBDJFLI',
  'BCDFGIJK:CGBDJFIK',
  'BCDFGHKL:CGBDHFLK',
  'BCDFGHJL:CGBDHFLJ',
  'BCDFGHJK:HGBCJFDK',
  'BCDFGHIL:CGBDHFLI',
  'BCDFGHIK:CGBDHFIK',
  'BCDFGHIJ:HGBCJFDI',
  'BCDEIJKL:EJBCIDLK',
  'BCDEHJKL:EJBCHDLK',
  'BCDEHIKL:EIBCHDLK',
  'BCDEHIJL:EJBCHDLI',
  'BCDEHIJK:EJBCHDIK',
  'BCDEGJKL:EGBCJDLK',
  'BCDEGIKL:EGBCIDLK',
  'BCDEGIJL:EGBCJDLI',
  'BCDEGIJK:EGBCJDIK',
  'BCDEGHKL:EGBCHDLK',
  'BCDEGHJL:HGBCJDLE',
  'BCDEGHJK:HGBCJDEK',
  'BCDEGHIL:EGBCHDLI',
  'BCDEGHIK:EGBCHDIK',
  'BCDEGHIJ:HGBCJDEI',
  'BCDEFJKL:CJBDEFLK',
  'BCDEFIKL:CEBDIFLK',
  'BCDEFIJL:CJBDEFLI',
  'BCDEFIJK:CJBDEFIK',
  'BCDEFHKL:CEBDHFLK',
  'BCDEFHJL:CJBDHFLE',
  'BCDEFHJK:CJBDHFEK',
  'BCDEFHIL:CEBDHFLI',
  'BCDEFHIK:CEBDHFIK',
  'BCDEFHIJ:CJBDHFEI',
  'BCDEFGKL:CGBDEFLK',
  'BCDEFGJL:CGBDJFLE',
  'BCDEFGJK:CGBDJFEK',
  'BCDEFGIL:CGBDEFLI',
  'BCDEFGIK:CGBDEFIK',
  'BCDEFGIJ:CGBDJFEI',
  'BCDEFGHL:CGBDHFLE',
  'BCDEFGHK:CGBDHFEK',
  'BCDEFGHJ:HGBCJFDE',
  'BCDEFGHI:CGBDHFEI',
  'AFGHIJKL:HJIFAGLK',
  'AEGHIJKL:EJIAHGLK',
  'AEFHIJKL:EJIFAHLK',
  'AEFGIJKL:EJIFAGLK',
  'AEFGHJKL:EGJFAHLK',
  'AEFGHIKL:EGIFAHLK',
  'AEFGHIJL:EGJFAHLI',
  'AEFGHIJK:EGJFAHIK',
  'ADGHIJKL:HJIDAGLK',
  'ADFHIJKL:HJIDAFLK',
  'ADFGIJKL:IGJDAFLK',
  'ADFGHJKL:HGJDAFLK',
  'ADFGHIKL:HGIDAFLK',
  'ADFGHIJL:HGJDAFLI',
  'ADFGHIJK:HGJDAFIK',
  'ADEHIJKL:EJIDAHLK',
  'ADEGIJKL:EJIDAGLK',
  'ADEGHJKL:EGJDAHLK',
  'ADEGHIKL:EGIDAHLK',
  'ADEGHIJL:EGJDAHLI',
  'ADEGHIJK:EGJDAHIK',
  'ADEFIJKL:EJIDAFLK',
  'ADEFHJKL:HJEDAFLK',
  'ADEFHIKL:HEIDAFLK',
  'ADEFHIJL:HJEDAFLI',
  'ADEFHIJK:HJEDAFIK',
  'ADEFGJKL:EGJDAFLK',
  'ADEFGIKL:EGIDAFLK',
  'ADEFGIJL:EGJDAFLI',
  'ADEFGIJK:EGJDAFIK',
  'ADEFGHKL:HGEDAFLK',
  'ADEFGHJL:HGJDAFLE',
  'ADEFGHJK:HGJDAFEK',
  'ADEFGHIL:HGEDAFLI',
  'ADEFGHIK:HGEDAFIK',
  'ADEFGHIJ:HGJDAFEI',
  'ACGHIJKL:HJICAGLK',
  'ACFHIJKL:HJICAFLK',
  'ACFGIJKL:IGJCAFLK',
  'ACFGHJKL:HGJCAFLK',
  'ACFGHIKL:HGICAFLK',
  'ACFGHIJL:HGJCAFLI',
  'ACFGHIJK:HGJCAFIK',
  'ACEHIJKL:EJICAHLK',
  'ACEGIJKL:EJICAGLK',
  'ACEGHJKL:EGJCAHLK',
  'ACEGHIKL:EGICAHLK',
  'ACEGHIJL:EGJCAHLI',
  'ACEGHIJK:EGJCAHIK',
  'ACEFIJKL:EJICAFLK',
  'ACEFHJKL:HJECAFLK',
  'ACEFHIKL:HEICAFLK',
  'ACEFHIJL:HJECAFLI',
  'ACEFHIJK:HJECAFIK',
  'ACEFGJKL:EGJCAFLK',
  'ACEFGIKL:EGICAFLK',
  'ACEFGIJL:EGJCAFLI',
  'ACEFGIJK:EGJCAFIK',
  'ACEFGHKL:HGECAFLK',
  'ACEFGHJL:HGJCAFLE',
  'ACEFGHJK:HGJCAFEK',
  'ACEFGHIL:HGECAFLI',
  'ACEFGHIK:HGECAFIK',
  'ACEFGHIJ:HGJCAFEI',
  'ACDHIJKL:HJICADLK',
  'ACDGIJKL:IGJCADLK',
  'ACDGHJKL:HGJCADLK',
  'ACDGHIKL:HGICADLK',
  'ACDGHIJL:HGJCADLI',
  'ACDGHIJK:HGJCADIK',
  'ACDFIJKL:CJIDAFLK',
  'ACDFHJKL:HJFCADLK',
  'ACDFHIKL:HFICADLK',
  'ACDFHIJL:HJFCADLI',
  'ACDFHIJK:HJFCADIK',
  'ACDFGJKL:CGJDAFLK',
  'ACDFGIKL:CGIDAFLK',
  'ACDFGIJL:CGJDAFLI',
  'ACDFGIJK:CGJDAFIK',
  'ACDFGHKL:HGFCADLK',
  'ACDFGHJL:CGJDAFLH',
  'ACDFGHJK:HGJCAFDK',
  'ACDFGHIL:HGFCADLI',
  'ACDFGHIK:HGFCADIK',
  'ACDFGHIJ:HGJCAFDI',
  'ACDEIJKL:EJICADLK',
  'ACDEHJKL:HJECADLK',
  'ACDEHIKL:HEICADLK',
  'ACDEHIJL:HJECADLI',
  'ACDEHIJK:HJECADIK',
  'ACDEGJKL:EGJCADLK',
  'ACDEGIKL:EGICADLK',
  'ACDEGIJL:EGJCADLI',
  'ACDEGIJK:EGJCADIK',
  'ACDEGHKL:HGECADLK',
  'ACDEGHJL:HGJCADLE',
  'ACDEGHJK:HGJCADEK',
  'ACDEGHIL:HGECADLI',
  'ACDEGHIK:HGECADIK',
  'ACDEGHIJ:HGJCADEI',
  'ACDEFJKL:CJEDAFLK',
  'ACDEFIKL:CEIDAFLK',
  'ACDEFIJL:CJEDAFLI',
  'ACDEFIJK:CJEDAFIK',
  'ACDEFHKL:HEFCADLK',
  'ACDEFHJL:HJFCADLE',
  'ACDEFHJK:HJECAFDK',
  'ACDEFHIL:HEFCADLI',
  'ACDEFHIK:HEFCADIK',
  'ACDEFHIJ:HJECAFDI',
  'ACDEFGKL:CGEDAFLK',
  'ACDEFGJL:CGJDAFLE',
  'ACDEFGJK:CGJDAFEK',
  'ACDEFGIL:CGEDAFLI',
  'ACDEFGIK:CGEDAFIK',
  'ACDEFGIJ:CGJDAFEI',
  'ACDEFGHL:HGFCADLE',
  'ACDEFGHK:HGECAFDK',
  'ACDEFGHJ:HGJCAFDE',
  'ACDEFGHI:HGECAFDI',
  'ABGHIJKL:HJBAIGLK',
  'ABFHIJKL:HJBAIFLK',
  'ABFGIJKL:IJBFAGLK',
  'ABFGHJKL:HJBFAGLK',
  'ABFGHIKL:HGBAIFLK',
  'ABFGHIJL:HJBFAGLI',
  'ABFGHIJK:HJBFAGIK',
  'ABEHIJKL:EJBAIHLK',
  'ABEGIJKL:EJBAIGLK',
  'ABEGHJKL:EJBAHGLK',
  'ABEGHIKL:EGBAIHLK',
  'ABEGHIJL:EJBAHGLI',
  'ABEGHIJK:EJBAHGIK',
  'ABEFIJKL:EJBAIFLK',
  'ABEFHJKL:EJBFAHLK',
  'ABEFHIKL:EIBFAHLK',
  'ABEFHIJL:EJBFAHLI',
  'ABEFHIJK:EJBFAHIK',
  'ABEFGJKL:EJBFAGLK',
  'ABEFGIKL:EGBAIFLK',
  'ABEFGIJL:EJBFAGLI',
  'ABEFGIJK:EJBFAGIK',
  'ABEFGHKL:EGBFAHLK',
  'ABEFGHJL:HJBFAGLE',
  'ABEFGHJK:HJBFAGEK',
  'ABEFGHIL:EGBFAHLI',
  'ABEFGHIK:EGBFAHIK',
  'ABEFGHIJ:HJBFAGEI',
  'ABDHIJKL:IJBDAHLK',
  'ABDGIJKL:IJBDAGLK',
  'ABDGHJKL:HJBDAGLK',
  'ABDGHIKL:IGBDAHLK',
  'ABDGHIJL:HJBDAGLI',
  'ABDGHIJK:HJBDAGIK',
  'ABDFIJKL:IJBDAFLK',
  'ABDFHJKL:HJBDAFLK',
  'ABDFHIKL:HIBDAFLK',
  'ABDFHIJL:HJBDAFLI',
  'ABDFHIJK:HJBDAFIK',
  'ABDFGJKL:FJBDAGLK',
  'ABDFGIKL:IGBDAFLK',
  'ABDFGIJL:FJBDAGLI',
  'ABDFGIJK:FJBDAGIK',
  'ABDFGHKL:HGBDAFLK',
  'ABDFGHJL:HGBDAFLJ',
  'ABDFGHJK:HGBDAFJK',
  'ABDFGHIL:HGBDAFLI',
  'ABDFGHIK:HGBDAFIK',
  'ABDFGHIJ:HGBDAFIJ',
  'ABDEIJKL:EJBAIDLK',
  'ABDEHJKL:EJBDAHLK',
  'ABDEHIKL:EIBDAHLK',
  'ABDEHIJL:EJBDAHLI',
  'ABDEHIJK:EJBDAHIK',
  'ABDEGJKL:EJBDAGLK',
  'ABDEGIKL:EGBAIDLK',
  'ABDEGIJL:EJBDAGLI',
  'ABDEGIJK:EJBDAGIK',
  'ABDEGHKL:EGBDAHLK',
  'ABDEGHJL:HJBDAGLE',
  'ABDEGHJK:HJBDAGEK',
  'ABDEGHIL:EGBDAHLI',
  'ABDEGHIK:EGBDAHIK',
  'ABDEGHIJ:HJBDAGEI',
  'ABDEFJKL:EJBDAFLK',
  'ABDEFIKL:EIBDAFLK',
  'ABDEFIJL:EJBDAFLI',
  'ABDEFIJK:EJBDAFIK',
  'ABDEFHKL:HEBDAFLK',
  'ABDEFHJL:HJBDAFLE',
  'ABDEFHJK:HJBDAFEK',
  'ABDEFHIL:HEBDAFLI',
  'ABDEFHIK:HEBDAFIK',
  'ABDEFHIJ:HJBDAFEI',
  'ABDEFGKL:EGBDAFLK',
  'ABDEFGJL:EGBDAFLJ',
  'ABDEFGJK:EGBDAFJK',
  'ABDEFGIL:EGBDAFLI',
  'ABDEFGIK:EGBDAFIK',
  'ABDEFGIJ:EGBDAFIJ',
  'ABDEFGHL:HGBDAFLE',
  'ABDEFGHK:HGBDAFEK',
  'ABDEFGHJ:HGBDAFEJ',
  'ABDEFGHI:HGBDAFEI',
  'ABCHIJKL:IJBCAHLK',
  'ABCGIJKL:IJBCAGLK',
  'ABCGHJKL:HJBCAGLK',
  'ABCGHIKL:IGBCAHLK',
  'ABCGHIJL:HJBCAGLI',
  'ABCGHIJK:HJBCAGIK',
  'ABCFIJKL:IJBCAFLK',
  'ABCFHJKL:HJBCAFLK',
  'ABCFHIKL:HIBCAFLK',
  'ABCFHIJL:HJBCAFLI',
  'ABCFHIJK:HJBCAFIK',
  'ABCFGJKL:CJBFAGLK',
  'ABCFGIKL:IGBCAFLK',
  'ABCFGIJL:CJBFAGLI',
  'ABCFGIJK:CJBFAGIK',
  'ABCFGHKL:HGBCAFLK',
  'ABCFGHJL:HGBCAFLJ',
  'ABCFGHJK:HGBCAFJK',
  'ABCFGHIL:HGBCAFLI',
  'ABCFGHIK:HGBCAFIK',
  'ABCFGHIJ:HGBCAFIJ',
  'ABCEIJKL:EJBAICLK',
  'ABCEHJKL:EJBCAHLK',
  'ABCEHIKL:EIBCAHLK',
  'ABCEHIJL:EJBCAHLI',
  'ABCEHIJK:EJBCAHIK',
  'ABCEGJKL:EJBCAGLK',
  'ABCEGIKL:EGBAICLK',
  'ABCEGIJL:EJBCAGLI',
  'ABCEGIJK:EJBCAGIK',
  'ABCEGHKL:EGBCAHLK',
  'ABCEGHJL:HJBCAGLE',
  'ABCEGHJK:HJBCAGEK',
  'ABCEGHIL:EGBCAHLI',
  'ABCEGHIK:EGBCAHIK',
  'ABCEGHIJ:HJBCAGEI',
  'ABCEFJKL:EJBCAFLK',
  'ABCEFIKL:EIBCAFLK',
  'ABCEFIJL:EJBCAFLI',
  'ABCEFIJK:EJBCAFIK',
  'ABCEFHKL:HEBCAFLK',
  'ABCEFHJL:HJBCAFLE',
  'ABCEFHJK:HJBCAFEK',
  'ABCEFHIL:HEBCAFLI',
  'ABCEFHIK:HEBCAFIK',
  'ABCEFHIJ:HJBCAFEI',
  'ABCEFGKL:EGBCAFLK',
  'ABCEFGJL:EGBCAFLJ',
  'ABCEFGJK:EGBCAFJK',
  'ABCEFGIL:EGBCAFLI',
  'ABCEFGIK:EGBCAFIK',
  'ABCEFGIJ:EGBCAFIJ',
  'ABCEFGHL:HGBCAFLE',
  'ABCEFGHK:HGBCAFEK',
  'ABCEFGHJ:HGBCAFEJ',
  'ABCEFGHI:HGBCAFEI',
  'ABCDIJKL:IJBCADLK',
  'ABCDHJKL:HJBCADLK',
  'ABCDHIKL:HIBCADLK',
  'ABCDHIJL:HJBCADLI',
  'ABCDHIJK:HJBCADIK',
  'ABCDGJKL:CJBDAGLK',
  'ABCDGIKL:IGBCADLK',
  'ABCDGIJL:CJBDAGLI',
  'ABCDGIJK:CJBDAGIK',
  'ABCDGHKL:HGBCADLK',
  'ABCDGHJL:HGBCADLJ',
  'ABCDGHJK:HGBCADJK',
  'ABCDGHIL:HGBCADLI',
  'ABCDGHIK:HGBCADIK',
  'ABCDGHIJ:HGBCADIJ',
  'ABCDFJKL:CJBDAFLK',
  'ABCDFIKL:CIBDAFLK',
  'ABCDFIJL:CJBDAFLI',
  'ABCDFIJK:CJBDAFIK',
  'ABCDFHKL:HFBCADLK',
  'ABCDFHJL:CJBDAFLH',
  'ABCDFHJK:HJBCAFDK',
  'ABCDFHIL:HFBCADLI',
  'ABCDFHIK:HFBCADIK',
  'ABCDFHIJ:HJBCAFDI',
  'ABCDFGKL:CGBDAFLK',
  'ABCDFGJL:CGBDAFLJ',
  'ABCDFGJK:CGBDAFJK',
  'ABCDFGIL:CGBDAFLI',
  'ABCDFGIK:CGBDAFIK',
  'ABCDFGIJ:CGBDAFIJ',
  'ABCDFGHL:CGBDAFLH',
  'ABCDFGHK:HGBCAFDK',
  'ABCDFGHJ:HGBCAFDJ',
  'ABCDFGHI:HGBCAFDI',
  'ABCDEJKL:EJBCADLK',
  'ABCDEIKL:EIBCADLK',
  'ABCDEIJL:EJBCADLI',
  'ABCDEIJK:EJBCADIK',
  'ABCDEHKL:HEBCADLK',
  'ABCDEHJL:HJBCADLE',
  'ABCDEHJK:HJBCADEK',
  'ABCDEHIL:HEBCADLI',
  'ABCDEHIK:HEBCADIK',
  'ABCDEHIJ:HJBCADEI',
  'ABCDEGKL:EGBCADLK',
  'ABCDEGJL:EGBCADLJ',
  'ABCDEGJK:EGBCADJK',
  'ABCDEGIL:EGBCADLI',
  'ABCDEGIK:EGBCADIK',
  'ABCDEGIJ:EGBCADIJ',
  'ABCDEGHL:HGBCADLE',
  'ABCDEGHK:HGBCADEK',
  'ABCDEGHJ:HGBCADEJ',
  'ABCDEGHI:HGBCADEI',
  'ABCDEFKL:CEBDAFLK',
  'ABCDEFJL:CJBDAFLE',
  'ABCDEFJK:CJBDAFEK',
  'ABCDEFIL:CEBDAFLI',
  'ABCDEFIK:CEBDAFIK',
  'ABCDEFIJ:CJBDAFEI',
  'ABCDEFHL:HFBCADLE',
  'ABCDEFHK:HEBCAFDK',
  'ABCDEFHJ:HJBCAFDE',
  'ABCDEFHI:HEBCAFDI',
  'ABCDEFGL:CGBDAFLE',
  'ABCDEFGK:CGBDAFEK',
  'ABCDEFGJ:CGBDAFEJ',
  'ABCDEFGI:CGBDAFEI',
  'ABCDEFGH:HGBCAFDE',
] as const;

const FIFA_THIRD_PLACE_ASSIGNMENTS = new Map<string, string>(
  FIFA_THIRD_PLACE_ASSIGNMENT_ROWS.map((row) => {
    const [qualifiedGroups, assignments] = row.split(':');
    return [qualifiedGroups, assignments];
  }),
);

function scoreValue(value: number | ''): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function matchPredictionComplete(prediction: ScorePredictionProjection | undefined): prediction is {
  homeScore: number;
  awayScore: number;
} {
  const homeScore = scoreValue(prediction?.homeScore ?? '');
  const awayScore = scoreValue(prediction?.awayScore ?? '');
  return homeScore !== null && awayScore !== null;
}

function teamFromMatchSide(
  teamId: string | undefined,
  teamName: string,
  group: string,
  teamsById: Map<string, Team>,
  teamsByName: Map<string, Team>,
): Team {
  const byId = teamId ? teamsById.get(teamId) : undefined;
  const byName = teamsByName.get(teamName);
  return {
    teamId: byId?.teamId || byName?.teamId || teamId || teamName,
    name: byId?.name || byName?.name || teamName,
    group: byId?.group || byName?.group || group,
    code: byId?.code || byName?.code,
    fairPlay: byId?.fairPlay ?? byName?.fairPlay ?? 0,
    fifaRanking: byId?.fifaRanking ?? byName?.fifaRanking,
  };
}

function fifaRankingValue(row: StandingRow): number {
  return Number.isFinite(row.fifaRanking) ? Number(row.fifaRanking) : Number.MAX_SAFE_INTEGER;
}

function compareRows(a: StandingRow, b: StandingRow): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    b.fairPlay - a.fairPlay ||
    fifaRankingValue(a) - fifaRankingValue(b)
  );
}

export function compareThirdPlaceRows(a: StandingRow, b: StandingRow): number {
  return (
    b.points - a.points ||
    b.goalDifference - a.goalDifference ||
    b.goalsFor - a.goalsFor ||
    b.fairPlay - a.fairPlay ||
    fifaRankingValue(a) - fifaRankingValue(b)
  );
}

function rankGroup(
  rows: StandingRow[],
  groupMatches: Match[],
  predictions: Record<string, ScorePredictionProjection>,
): StandingRow[] {
  const byPoints = new Map<number, StandingRow[]>();
  rows.forEach((row) => {
    const bucket = byPoints.get(row.points) || [];
    bucket.push(row);
    byPoints.set(row.points, bucket);
  });

  return Array.from(byPoints.entries())
    .sort(([a], [b]) => b - a)
    .flatMap(([, tiedRows]: [number, StandingRow[]]) => {
      if (tiedRows.length <= 1) return tiedRows;

      const tiedIds = new Set(tiedRows.map((row: StandingRow) => row.teamId));
      const headToHead = new Map<string, { points: number; goalDifference: number; goalsFor: number }>();
      tiedRows.forEach((row: StandingRow) => headToHead.set(row.teamId, { points: 0, goalDifference: 0, goalsFor: 0 }));

      groupMatches.forEach((match) => {
        if (!match.homeTeamId || !match.awayTeamId) return;
        if (!tiedIds.has(match.homeTeamId) || !tiedIds.has(match.awayTeamId)) return;
        const prediction = predictions[match.matchId];
        if (!matchPredictionComplete(prediction)) return;

        const home = headToHead.get(match.homeTeamId);
        const away = headToHead.get(match.awayTeamId);
        if (!home || !away) return;

        home.goalsFor += prediction.homeScore;
        away.goalsFor += prediction.awayScore;
        home.goalDifference += prediction.homeScore - prediction.awayScore;
        away.goalDifference += prediction.awayScore - prediction.homeScore;
        if (prediction.homeScore > prediction.awayScore) {
          home.points += 3;
        } else if (prediction.homeScore < prediction.awayScore) {
          away.points += 3;
        } else {
          home.points += 1;
          away.points += 1;
        }
      });

      return tiedRows.slice().sort((a: StandingRow, b: StandingRow) => {
        const home = headToHead.get(a.teamId);
        const away = headToHead.get(b.teamId);
        return (
          (away?.points ?? 0) - (home?.points ?? 0) ||
          (away?.goalDifference ?? 0) - (home?.goalDifference ?? 0) ||
          (away?.goalsFor ?? 0) - (home?.goalsFor ?? 0) ||
          compareRows(a, b)
        );
      });
    });
}

export function computeGroupStandings(
  matchesByGroup: Record<string, Match[]>,
  predictions: Record<string, ScorePredictionProjection>,
  teams: Team[],
): Record<string, StandingRow[]> {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const teamsByName = new Map(teams.map((team) => [team.name, team]));
  const standings: Record<string, StandingRow[]> = {};

  Object.entries(matchesByGroup).forEach(([group, groupMatches]) => {
    const rowsByTeam = new Map<string, StandingRow>();
    const ensureRow = (team: Team) => {
      const existing = rowsByTeam.get(team.teamId);
      if (existing) return existing;
      const row: StandingRow = {
        ...team,
        group,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        fairPlay: Number.isFinite(team.fairPlay) ? Number(team.fairPlay) : 0,
      };
      rowsByTeam.set(team.teamId, row);
      return row;
    };

    groupMatches.forEach((match) => {
      const home = ensureRow(
        teamFromMatchSide(match.homeTeamId, match.homeTeamName, group, teamsById, teamsByName),
      );
      const away = ensureRow(
        teamFromMatchSide(match.awayTeamId, match.awayTeamName, group, teamsById, teamsByName),
      );
      const prediction = predictions[match.matchId];
      if (!matchPredictionComplete(prediction)) return;

      home.played += 1;
      away.played += 1;
      home.goalsFor += prediction.homeScore;
      home.goalsAgainst += prediction.awayScore;
      away.goalsFor += prediction.awayScore;
      away.goalsAgainst += prediction.homeScore;
      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (prediction.homeScore > prediction.awayScore) {
        home.points += 3;
      } else if (prediction.homeScore < prediction.awayScore) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    });

    standings[group] = rankGroup(Array.from(rowsByTeam.values()), groupMatches, predictions);
  });

  return standings;
}

export function computeRealGroupStandings(
  matchesByGroup: Record<string, Match[]>,
  teams: Team[],
): Record<string, StandingRow[]> {
  const teamsById = new Map(teams.map((team) => [team.teamId, team]));
  const teamsByName = new Map(teams.map((team) => [team.name, team]));
  const standings: Record<string, StandingRow[]> = {};
  const groups = new Set([
    ...Object.keys(matchesByGroup),
    ...teams.map((team) => team.group).filter((group): group is string => Boolean(group)),
  ]);

  groups.forEach((group) => {
    const groupMatches = matchesByGroup[group] ?? [];
    const rowsByTeam = new Map<string, StandingRow>();

    const ensureRow = (team: Team): StandingRow => {
      const existing = rowsByTeam.get(team.teamId);
      if (existing) return existing;

      const fairPlay = Number(team.fairPlay);

      const row: StandingRow = {
        ...team,
        group,
        played: 0,
        points: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        goalDifference: 0,
        fairPlay: Number.isFinite(fairPlay) ? fairPlay : 0,
      };

      rowsByTeam.set(team.teamId, row);
      return row;
    };

    teams
      .filter((team) => team.group === group)
      .forEach(ensureRow);

    groupMatches.forEach((match) => {
      const home = ensureRow(
        teamFromMatchSide(match.homeTeamId, match.homeTeamName, group, teamsById, teamsByName),
      );
      const away = ensureRow(
        teamFromMatchSide(match.awayTeamId, match.awayTeamName, group, teamsById, teamsByName),
      );

      if (typeof match.homeResult !== 'number' || typeof match.awayResult !== 'number') return;
      if (!Number.isFinite(match.homeResult) || !Number.isFinite(match.awayResult)) return;
      if (match.status && match.status !== 'completed') return;
      if (home.teamId === away.teamId) return;

      const homeResult = match.homeResult;
      const awayResult = match.awayResult;

      home.played += 1;
      away.played += 1;

      home.goalsFor += homeResult;
      home.goalsAgainst += awayResult;

      away.goalsFor += awayResult;
      away.goalsAgainst += homeResult;

      home.goalDifference = home.goalsFor - home.goalsAgainst;
      away.goalDifference = away.goalsFor - away.goalsAgainst;

      if (homeResult > awayResult) {
        home.points += 3;
      } else if (homeResult < awayResult) {
        away.points += 3;
      } else {
        home.points += 1;
        away.points += 1;
      }
    });

    standings[group] = rankGroupFromResults(Array.from(rowsByTeam.values()), groupMatches);
  });

  return standings;
}

function rankGroupFromResults(
  rows: StandingRow[],
  groupMatches: Match[],
): StandingRow[] {
  const byPoints = new Map<number, StandingRow[]>();
  rows.forEach((row) => {
    const bucket = byPoints.get(row.points) || [];
    bucket.push(row);
    byPoints.set(row.points, bucket);
  });

  return Array.from(byPoints.entries())
    .sort(([a], [b]) => b - a)
    .flatMap(([, tiedRows]: [number, StandingRow[]]) => {
      if (tiedRows.length <= 1) return tiedRows;

      const tiedIds = new Set(tiedRows.map((row: StandingRow) => row.teamId));
      const headToHead = new Map<string, { points: number; goalDifference: number; goalsFor: number }>();
      tiedRows.forEach((row: StandingRow) =>
        headToHead.set(row.teamId, { points: 0, goalDifference: 0, goalsFor: 0 })
      );

      groupMatches.forEach((match) => {
        if (!match.homeTeamId || !match.awayTeamId) return;
        if (!tiedIds.has(match.homeTeamId) || !tiedIds.has(match.awayTeamId)) return;
        if (typeof match.homeResult !== 'number' || typeof match.awayResult !== 'number') return;
        if (!Number.isFinite(match.homeResult) || !Number.isFinite(match.awayResult)) return;
        if (match.status && match.status !== 'completed') return;

        const home = headToHead.get(match.homeTeamId);
        const away = headToHead.get(match.awayTeamId);
        if (!home || !away) return;

        home.goalsFor += match.homeResult;
        away.goalsFor += match.awayResult;
        home.goalDifference += match.homeResult - match.awayResult;
        away.goalDifference += match.awayResult - match.homeResult;
        if (match.homeResult > match.awayResult) {
          home.points += 3;
        } else if (match.homeResult < match.awayResult) {
          away.points += 3;
        } else {
          home.points += 1;
          away.points += 1;
        }
      });

      return tiedRows.slice().sort((a: StandingRow, b: StandingRow) => {
        const home = headToHead.get(a.teamId);
        const away = headToHead.get(b.teamId);
        return (
          (away?.points ?? 0) - (home?.points ?? 0) ||
          (away?.goalDifference ?? 0) - (home?.goalDifference ?? 0) ||
          (away?.goalsFor ?? 0) - (home?.goalsFor ?? 0) ||
          compareRows(a, b)
        );
      });
    });
}

function selectedTeam(prediction: BracketPredictionProjection | undefined, side: 'home' | 'away'): Team | null {
  const teamId = side === 'home' ? prediction?.homeTeamId : prediction?.awayTeamId;
  const name = side === 'home' ? prediction?.homeTeamName : prediction?.awayTeamName;
  return teamId && name ? { teamId, name } : null;
}

function selectedTeams(prediction: BracketPredictionProjection | undefined): Team[] {
  return [selectedTeam(prediction, 'home'), selectedTeam(prediction, 'away')].filter(Boolean) as Team[];
}

function teamAllowed(teamId: string | undefined, candidates: Team[]): boolean {
  if (!teamId) return true;
  return candidates.some((candidate) => candidate.teamId === teamId);
}

function matchByNumber(bracket: Record<string, BracketMatch[]>, matchNumber: number) {
  return Object.values(bracket)
    .flat()
    .find((match) => match.matchNumber === matchNumber);
}

function sourceMatchNumber(sourceLabel: string | undefined): number | null {
  const match = sourceLabel?.match(/^W(\d+)$/);
  return match ? Number(match[1]) : null;
}

function sourceCandidates(
  sourceLabel: string | undefined,
  standings: Record<string, StandingRow[]>,
  qualifiedThirds: StandingRow[],
  bracket: Record<string, BracketMatch[]>,
  effectivePredictions: Record<string, BracketPredictionProjection>,
): Team[] {
  if (!sourceLabel) return [];

  const direct = sourceLabel.match(/^([12])([A-L])$/);
  if (direct) {
    const rank = Number(direct[1]) - 1;
    const group = direct[2];
    const groupRows = standings[group] || [];
    const projectedDefault = groupRows[rank];
    return projectedDefault
      ? [projectedDefault, ...groupRows.filter((row) => row.teamId !== projectedDefault.teamId)]
      : groupRows;
  }

  const third = sourceLabel.match(/^3([A-L]+)$/);
  if (third) {
    const allowedGroups = new Set(third[1].split(''));
    const projectedThirds = qualifiedThirds.filter((row) => row.group && allowedGroups.has(row.group));
    const projectedIds = new Set(projectedThirds.map((row) => row.teamId));
    const allowedGroupTeams = Object.values(standings)
      .flat()
      .filter((row) => row.group && allowedGroups.has(row.group) && !projectedIds.has(row.teamId));
    return [...projectedThirds, ...allowedGroupTeams];
  }

  const winnerMatchNumber = sourceMatchNumber(sourceLabel);
  if (winnerMatchNumber) {
    const sourceMatch = matchByNumber(bracket, winnerMatchNumber);
    return selectedTeams(sourceMatch ? effectivePredictions[sourceMatch.bracketMatchId] : undefined);
  }

  return [];
}

function assignThirdPlaceDefaults(
  bracket: Record<string, BracketMatch[]>,
  qualifiedThirds: StandingRow[],
): Record<string, Team> {
  const assigned: Record<string, Team> = {};
  const thirdRows = qualifiedThirds.filter((row) => /^[A-L]$/.test(row.group || ''));
  const byGroup = new Map(thirdRows.map((row) => [row.group || '', row]));
  if (byGroup.size !== 8) return assigned;

  const combinationKey = Array.from(byGroup.keys()).sort().join('');
  const assignmentGroups = FIFA_THIRD_PLACE_ASSIGNMENTS.get(combinationKey);
  if (!assignmentGroups || assignmentGroups.length !== THIRD_PLACE_WINNER_GROUP_ORDER.length) {
    return assigned;
  }

  const groupByWinnerGroup = new Map(
    THIRD_PLACE_WINNER_GROUP_ORDER.map((winnerGroup, index) => [
      winnerGroup,
      assignmentGroups[index],
    ]),
  );

  (bracket['16th-finals'] || []).forEach((match) => {
    ([
      {
        side: 'home',
        sourceLabel: match.homeSourceLabel,
        opponentSourceLabel: match.awaySourceLabel,
      },
      {
        side: 'away',
        sourceLabel: match.awaySourceLabel,
        opponentSourceLabel: match.homeSourceLabel,
      },
    ] as const).forEach(({ side, sourceLabel, opponentSourceLabel }) => {
      const thirdSlot = sourceLabel?.match(/^3([A-L]+)$/);
      if (!thirdSlot) return;

      const winnerGroupMatch = opponentSourceLabel?.match(/^1([ABDEGIKL])$/);
      if (!winnerGroupMatch) return;
      const winnerGroup = winnerGroupMatch[1] as (typeof THIRD_PLACE_WINNER_GROUP_ORDER)[number];

      const assignedThirdGroup = groupByWinnerGroup.get(winnerGroup);
      const assignedTeam = assignedThirdGroup ? byGroup.get(assignedThirdGroup) : undefined;
      if (!assignedThirdGroup || !assignedTeam) return;

      const allowedGroups = new Set(thirdSlot[1].split(''));
      if (!allowedGroups.has(assignedThirdGroup)) return;

      assigned[`${match.bracketMatchId}:${side}`] = assignedTeam;
    });
  });

  return assigned;
}

export function buildBracketProjection({
  matchesByGroup,
  groupPredictions,
  teams,
  bracket,
  bracketPredictions,
  prefillRoundOf32 = false,
}: {
  matchesByGroup: Record<string, Match[]>;
  groupPredictions: Record<string, ScorePredictionProjection>;
  teams: Team[];
  bracket: Record<string, BracketMatch[]>;
  bracketPredictions: Record<string, BracketPredictionProjection>;
  prefillRoundOf32?: boolean;
}) {
  const standings = computeGroupStandings(matchesByGroup, groupPredictions, teams);
  const qualifiedThirds = Object.values(standings)
    .map((rows) => rows[2])
    .filter(Boolean)
    .sort(compareRows)
    .slice(0, 8);
  const thirdDefaults = assignThirdPlaceDefaults(bracket, qualifiedThirds);
  const effectivePredictions: Record<string, BracketPredictionProjection> = {};
  const candidateOptions: BracketCandidateMap = {};

  PHASE_ORDER.forEach((phase) => {
    (bracket[phase] || []).forEach((match) => {
      const existing = bracketPredictions[match.bracketMatchId] || {};
      const candidates = {
        home: sourceCandidates(match.homeSourceLabel, standings, qualifiedThirds, bracket, effectivePredictions),
        away: sourceCandidates(match.awaySourceLabel, standings, qualifiedThirds, bracket, effectivePredictions),
      };

      if (phase === '16th-finals') {
        const homeThird = thirdDefaults[`${match.bracketMatchId}:home`];
        const awayThird = thirdDefaults[`${match.bracketMatchId}:away`];
        const homeDefault = prefillRoundOf32 ? homeThird || candidates.home[0] : undefined;
        const awayDefault = prefillRoundOf32 ? awayThird || candidates.away[0] : undefined;
        const existingHomeAllowed = teamAllowed(existing.homeTeamId, candidates.home);
        const existingAwayAllowed = teamAllowed(existing.awayTeamId, candidates.away);
        const homeTeamId = existingHomeAllowed && existing.homeTeamId ? existing.homeTeamId : homeDefault?.teamId || '';
        const homeTeamName = existingHomeAllowed && existing.homeTeamName ? existing.homeTeamName : homeDefault?.name || '';
        const awayTeamId = existingAwayAllowed && existing.awayTeamId ? existing.awayTeamId : awayDefault?.teamId || '';
        const awayTeamName = existingAwayAllowed && existing.awayTeamName ? existing.awayTeamName : awayDefault?.name || '';

        effectivePredictions[match.bracketMatchId] = {
          ...existing,
          bracketMatchId: match.bracketMatchId,
          homeTeamId,
          homeTeamName,
          awayTeamId,
          awayTeamName,
        };
      } else {
        const homeTeamId = teamAllowed(existing.homeTeamId, candidates.home) ? existing.homeTeamId || '' : '';
        const homeTeamName = homeTeamId ? existing.homeTeamName || '' : '';
        const awayTeamId = teamAllowed(existing.awayTeamId, candidates.away) ? existing.awayTeamId || '' : '';
        const awayTeamName = awayTeamId ? existing.awayTeamName || '' : '';
        const predictedWinnerTeamId =
          match.phase === 'finals' &&
          existing.predictedWinnerTeamId &&
          (existing.predictedWinnerTeamId === homeTeamId || existing.predictedWinnerTeamId === awayTeamId)
            ? existing.predictedWinnerTeamId
            : '';
        const predictedWinnerTeamName = predictedWinnerTeamId ? existing.predictedWinnerTeamName || '' : '';

        effectivePredictions[match.bracketMatchId] = {
          ...existing,
          bracketMatchId: match.bracketMatchId,
          homeTeamId,
          homeTeamName,
          awayTeamId,
          awayTeamName,
          predictedWinnerTeamId,
          predictedWinnerTeamName,
        };
      }

      candidateOptions[match.bracketMatchId] = candidates;
    });
  });

  return {
    candidateOptions,
    effectivePredictions,
  };
}

function adminSourceCandidates(
  sourceLabel: string | undefined,
  bracket: Record<string, BracketMatch[]>,
  teams: Team[],
): Team[] {
  if (!sourceLabel) return teams;

  // Group slot (1A, 2B, …) — filter by group
  const direct = sourceLabel.match(/^([12])([A-L])$/);
  if (direct) {
    const group = direct[2];
    const groupTeams = teams.filter((t) => t.group === group);
    return groupTeams.length > 0 ? groupTeams : teams;
  }

  // Third-place slot (3ABCD …) — filter to teams from those groups
  const third = sourceLabel.match(/^3([A-L]+)$/);
  if (third) {
    const allowedGroups = new Set(third[1].split(''));
    const filtered = teams.filter((t) => t.group && allowedGroups.has(t.group));
    return filtered.length > 0 ? filtered : teams;
  }

  // Winner slot (W{matchNumber}) — limit to the two teams playing in that match.
  // Return an empty array when the source match hasn't been filled yet so downstream
  // slots show no options until their feeding match is resolved (cascade enforcement).
  const winnerMatchNumber = sourceMatchNumber(sourceLabel);
  if (winnerMatchNumber !== null) {
    const sourceMatch = matchByNumber(bracket, winnerMatchNumber);
    if (sourceMatch) {
      const candidates: Team[] = [];
      const home = teams.find((t) => t.teamId === sourceMatch.homeTeamId);
      const away = teams.find((t) => t.teamId === sourceMatch.awayTeamId);
      if (home) candidates.push(home);
      if (away) candidates.push(away);
      return candidates; // empty = source match not set yet → no options available downstream
    }
    return []; // source match not found in bracket
  }

  return teams;
}

export function computeAdminCandidateOptions(
  bracket: Record<string, BracketMatch[]>,
  teams: Team[],
): BracketCandidateMap {
  const options: BracketCandidateMap = {};
  Object.values(bracket).flat().forEach((match) => {
    options[match.bracketMatchId] = {
      home: adminSourceCandidates(match.homeSourceLabel, bracket, teams),
      away: adminSourceCandidates(match.awaySourceLabel, bracket, teams),
    };
  });
  return options;
}
