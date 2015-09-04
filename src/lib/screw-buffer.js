/* global LEVEL_OBJECT, LEVEL_STRING, LEVEL_UNDEFINED, assignNoEnum */

var ScrewBuffer;

var getAppendLength;
var hasOuterPlus;

(function ()
{
    'use strict';
    
    // The solution parameter must already have the outerPlus property set.
    function appendSolution(str, solution)
    {
        if (solution.outerPlus)
        {
            str += '+(' + solution + ')';
        }
        else
        {
            str += '+' + solution;
        }
        return str;
    }
    
    ScrewBuffer =
        function (strongBound, forceString, groupThreshold)
        {
            function findBridge(index)
            {
                for (;; ++index)
                {
                    var solution = solutions[index];
                    if (solution.bridge)
                    {
                        return index;
                    }
                }
            }
            
            function findSplitIndex(intrinsicSplitCost, startIndex, endIndex)
            {
                var index = startIndex;
                var optimalSplitCost = getSplitCostAt(index, true);
                var splitIndex = index;
                while (++index < endIndex)
                {
                    var splitCost = getSplitCostAt(index, false);
                    if (splitCost < optimalSplitCost)
                    {
                        optimalSplitCost = splitCost;
                        splitIndex = index;
                    }
                }
                if (optimalSplitCost + intrinsicSplitCost < 0)
                {
                    return splitIndex;
                }
            }
            
            function gather(localStrongBound)
            {
                var str;
                var index = findBridge(0);
                var offset;
                if (index > 1)
                {
                    var intrinsicSplitCost = forceString ? -3 : strongBound ? 2 : 0;
                    offset = findSplitIndex(intrinsicSplitCost, 1, index);
                }
                var multiPart = offset != null;
                if (multiPart)
                {
                    // Keep the first offset solutions out of the concat context to reduce output
                    // length.
                    str = sequence1(0, offset) + '+';
                }
                else
                {
                    str = '';
                    offset = 0;
                }
                str += '[' + sequence0(offset, index - offset, '[]') + ']';
                for (;;)
                {
                    str += solutions[index].bridge.block + '(';
                    offset = index + 1;
                    if (index === lastBridgeIndex)
                    {
                        break;
                    }
                    index = findBridge(offset);
                    str += sequence0(offset, index - offset, '[[]]') + ')';
                }
                var solutionCount = solutions.length;
                var count = solutionCount - offset;
                if (forceString && !multiPart && count > 1)
                {
                    str += solutions[offset] + ')';
                    while (++offset < solutionCount)
                    {
                        str = appendSolution(str, solutions[offset]);
                    }
                    multiPart = true;
                }
                else
                {
                    str += sequence0(offset, count, '[[]]') + ')';
                }
                if (!multiPart && forceString)
                {
                    str += '+[]';
                    multiPart = true;
                }
                if (localStrongBound && multiPart)
                {
                    str = '(' + str + ')';
                }
                return str;
            }
            
            function getSplitCostAt(index, leftmost)
            {
                var splitCost;
                var solutionLeft    = solutions[index - 1];
                var solutionCenter  = solutions[index];
                var solutionRight   = solutions[index + 1];
                var levelLeft   = solutionLeft.level;
                var levelCenter = solutionCenter.level;
                var levelRight  = solutionRight.level;
                if (leftmost && levelLeft < LEVEL_OBJECT && levelCenter < LEVEL_OBJECT)
                {
                    splitCost =
                        levelLeft > LEVEL_UNDEFINED || levelCenter > LEVEL_UNDEFINED ? -2 : -3;
                }
                else
                {
                    splitCost = solutionCenter.outerPlus ? -2 : 0;
                }
                if (levelCenter < LEVEL_OBJECT && levelRight < LEVEL_OBJECT)
                {
                    splitCost +=
                        levelCenter > LEVEL_UNDEFINED || levelRight > LEVEL_UNDEFINED ? 2 : 3;
                    if (solutionRight.outerPlus)
                    {
                        splitCost -= 2;
                    }
                }
                return splitCost;
            }
            
            function sequence(offset, count)
            {
                var str;
                var solution0 = solutions[offset];
                var solution1 = solutions[offset + 1];
                if (solution0.level < LEVEL_OBJECT && solution1.level < LEVEL_OBJECT)
                {
                    if (solution1.level > LEVEL_UNDEFINED)
                    {
                        str = solution0 + '+[' + solution1 + ']';
                    }
                    else if (solution0.level > LEVEL_UNDEFINED)
                    {
                        str = '[' + solution0 + ']+' + solution1;
                    }
                    else
                    {
                        str = solution0 + '+[]+' + solution1;
                    }
                }
                else
                {
                    str = appendSolution(solution0, solution1);
                }
                for (var index = 2; index < count; ++index)
                {
                    var solution = solutions[offset + index];
                    str = appendSolution(str, solution);
                }
                return str;
            }
            
            function sequence0(offset, count, emptyReplacement)
            {
                var str = count ? sequence1(offset, count) : emptyReplacement;
                return str;
            }
            
            function sequence1(offset, count)
            {
                var str = count > 1 ? sequence(offset, count) : solutions[offset] + '';
                return str;
            }
            
            var solutions = [];
            var length = strongBound ? -1 : -3;
            var maxSolutionCount = Math.pow(2, groupThreshold - 1);
            var lastBridgeIndex;
            
            assignNoEnum(
                this,
                {
                    append: function (solution)
                    {
                        if (solutions.length >= maxSolutionCount)
                        {
                            return false;
                        }
                        if (solution.bridge)
                        {
                            lastBridgeIndex = solutions.length;
                        }
                        solutions.push(solution);
                        length += getAppendLength(solution);
                        return true;
                    },
                    get length ()
                    {
                        var result;
                        switch (solutions.length)
                        {
                        case 0:
                            result = forceString ? strongBound ? 7 : 5 : 0;
                            break;
                        case 1:
                            var solution = solutions[0];
                            result =
                                solution.length +
                                (
                                    forceString && solution.level < LEVEL_STRING ?
                                    strongBound ? 5 : 3 : 0
                                );
                            break;
                        default:
                            result = length;
                            break;
                        }
                        return result;
                    },
                    toString: function ()
                    {
                        function collect(offset, count, maxGroupCount)
                        {
                            if (count <= groupSize + 1)
                            {
                                str += sequence(offset, count);
                            }
                            else
                            {
                                maxGroupCount /= 2;
                                var halfCount = groupSize * maxGroupCount;
                                var capacity = 2 * halfCount - count;
                                var leftCount =
                                    Math.max(
                                        halfCount - capacity + capacity % (groupSize - 1),
                                        (maxGroupCount / 2 ^ 0) * (groupSize + 1)
                                    );
                                collect(offset, leftCount, maxGroupCount);
                                str += '+(';
                                collect(offset + leftCount, count - leftCount, maxGroupCount);
                                str += ')';
                            }
                        }
                        
                        var singlePart;
                        var str;
                        var solutionCount = solutions.length;
                        if (!solutionCount)
                        {
                            singlePart = !forceString;
                            str = singlePart ? '' : '[]+[]';
                        }
                        else if (solutionCount === 1)
                        {
                            var solution = solutions[0];
                            // Here we assume that string solutions never have an outer plus.
                            singlePart = !forceString || solution.level > LEVEL_OBJECT;
                            str = solution + (singlePart ? '' : '+[]');
                        }
                        else if (solutionCount <= groupThreshold)
                        {
                            if (lastBridgeIndex == null)
                            {
                                str = sequence(0, solutionCount);
                            }
                            else
                            {
                                str = gather(strongBound);
                                singlePart = strongBound;
                            }
                        }
                        else
                        {
                            var groupSize = groupThreshold;
                            var maxGroupCount = 2;
                            for (;;)
                            {
                                --groupSize;
                                var maxSolutionCountForDepth = groupSize * maxGroupCount;
                                if (solutionCount <= maxSolutionCountForDepth)
                                {
                                    break;
                                }
                                maxGroupCount *= 2;
                            }
                            str = '';
                            collect(0, solutionCount, maxGroupCount);
                        }
                        if (strongBound && !singlePart)
                        {
                            str = '(' + str + ')';
                        }
                        return str;
                    }
                }
            );
        };
    
    getAppendLength =
        // This function assumes that only undefined or numeric solutions can have an outer plus.
        function (solution)
        {
            var length;
            var bridge = solution.bridge;
            if (bridge)
            {
                length = bridge.appendLength;
            }
            else
            {
                var extraLength = hasOuterPlus(solution) ? 3 : 1;
                length = solution.length + extraLength;
            }
            return length;
        };
    
    hasOuterPlus =
        // Determine whether the specified solution contains a plus sign out of brackets not
        // preceded by an exclamation mark.
        function (solution)
        {
            var outerPlus = solution.outerPlus;
            if (outerPlus == null)
            {
                var unclosed = 0;
                outerPlus =
                    solution.match(/!\+|./g).some(
                        function (match)
                        {
                            switch (match)
                            {
                            case '+':
                                return !unclosed;
                            case '(':
                            case '[':
                                ++unclosed;
                                break;
                            case ')':
                            case ']':
                                --unclosed;
                                break;
                            }
                            return false;
                        }
                    );
                solution.outerPlus = outerPlus;
            }
            return outerPlus;
        };
}
)();
