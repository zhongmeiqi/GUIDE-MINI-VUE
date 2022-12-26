// /abc/.test("")
function test(string){
    let i;
    let startIndex;
    let endIndex;
    let result = []
    function waitForA(char){
        if(char ==="a"){
            let startIndex = i
            return waitForB;
        }
        return waitForA;
    }
    function waitForB(char){
        if(char==='b'){
          return waitForC;
        }
        return waitForA
    }
    function waitForC(char){
        if(char==='c'||char ==='d'){
            endIndex = i
            return end;
        }
        return waitForA
    }
    function end(){
        return end;
    }
    let currentState = waitForA
    for( i =0;i<string.length;i++){
        let nextState = currentState(string[i]);
        currentState = nextState;
        if(currentState ===end){
            console.log(startIndex,endIndex)
            result.push(startIndex,endIndex)
            currentState = waitForA
            return true
        }
    }
    return false
}
console.log(test('ac'))